using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Exams.Api.DTOs;
using Exams.Domain.Entities;
using Exams.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Exams.Tests
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        private static readonly Microsoft.EntityFrameworkCore.Storage.InMemoryDatabaseRoot _dbRoot = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => 
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(AppDbContext)).ToList();

                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("ExamsTestingInMemoryDb", _dbRoot);
                });
            });
        }
    }

    public class ExamIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public ExamIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private async Task<string> LoginAsync(string email, string password)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
            response.EnsureSuccessStatusCode();
            var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
            return auth!.Token;
        }

        [Fact]
        public async Task Login_WithValidTeacherCredentials_ReturnsJwtToken()
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("teacher@exams.com", "Teacher123!"));
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
            Assert.NotNull(auth);
            Assert.NotEmpty(auth.Token);
            Assert.Equal("Teacher", auth.User.Role);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("teacher@exams.com", "WrongPassword!"));
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetExams_WhenAuthenticatedAsStudent_ReturnsAssignedExams()
        {
            var token = await LoginAsync("student@exams.com", "Student123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/exams");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var exams = await response.Content.ReadFromJsonAsync<List<ExamSummaryDto>>();
            Assert.NotNull(exams);
            Assert.NotEmpty(exams);
        }

        [Fact]
        public async Task GetExamDetail_AsStudent_DoesNotRevealIsCorrectAnswers()
        {
            var token = await LoginAsync("student@exams.com", "Student123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var listResp = await _client.GetAsync("/exams");
            var exams = await listResp.Content.ReadFromJsonAsync<List<ExamSummaryDto>>();
            var examId = exams!.First().Id;

            var detailResp = await _client.GetAsync($"/exams/{examId}");
            Assert.Equal(HttpStatusCode.OK, detailResp.StatusCode);

            var detail = await detailResp.Content.ReadFromJsonAsync<ExamDetailDto>();
            Assert.NotNull(detail);

            // Verify that for all questions, option.IsCorrect is null for students
            foreach (var q in detail.Questions)
            {
                foreach (var opt in q.Options)
                {
                    Assert.Null(opt.IsCorrect);
                }
            }
        }

        [Fact]
        public async Task Teacher_CanCreateNewExam_AndStudentCanSubmit()
        {
            // 1. Teacher creates exam
            var teacherToken = await LoginAsync("teacher@exams.com", "Teacher123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", teacherToken);

            var createExamReq = new CreateExamRequest(
                Title: "Examen de Algoritmos Avanzados",
                Description: "Estructuras de datos y complejidad algorítmica",
                DurationMinutes: 60,
                StartsAt: DateTime.UtcNow.AddMinutes(-10),
                EndsAt: DateTime.UtcNow.AddDays(2)
            );

            var createResp = await _client.PostAsJsonAsync("/exams", createExamReq);
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var createdExam = await createResp.Content.ReadFromJsonAsync<Exam>();
            Assert.NotNull(createdExam);

            // 2. Teacher adds a question
            var createQReq = new CreateQuestionRequest(
                ExamId: createdExam.Id,
                Type: "MultipleChoice",
                Text: "¿Cuál es la complejidad temporal promedio de Quicksort?",
                Points: 10,
                Order: 1,
                Options: new List<CreateOptionDto>
                {
                    new CreateOptionDto("O(n log n)", true),
                    new CreateOptionDto("O(n^2)", false)
                }
            );

            var qResp = await _client.PostAsJsonAsync("/questions", createQReq);
            Assert.Equal(HttpStatusCode.Created, qResp.StatusCode);

            // 3. Teacher assigns exam to student
            var studentId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var assignResp = await _client.PostAsJsonAsync($"/exams/{createdExam.Id}/assign", new AssignExamRequest(null, studentId));
            Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);

            // 4. Student starts exam
            var studentToken = await LoginAsync("student@exams.com", "Student123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

            var startResp = await _client.PostAsJsonAsync("/submissions/start", new StartSubmissionRequest(createdExam.Id));
            Assert.Equal(HttpStatusCode.OK, startResp.StatusCode);
            var startData = await startResp.Content.ReadFromJsonAsync<SubmissionStartedResponse>();
            Assert.NotNull(startData);
            Assert.NotEmpty(startData.Questions);

            var question = startData.Questions.First();
            var chosenOptionId = question.Options.First().Id;

            // 5. Student submits answers
            var submitReq = new SubmitExamRequest(
                SubmissionId: startData.SubmissionId,
                Answers: new List<SubmitAnswerDto>
                {
                    new SubmitAnswerDto(question.Id, chosenOptionId, null)
                }
            );

            var submitResp = await _client.PostAsJsonAsync("/submissions", submitReq);
            Assert.Equal(HttpStatusCode.OK, submitResp.StatusCode);

            // 6. Student checks results
            var resultsResp = await _client.GetAsync($"/results/{studentId}");
            var body = await resultsResp.Content.ReadAsStringAsync();
            Assert.True(resultsResp.IsSuccessStatusCode, $"Error {resultsResp.StatusCode}: {body}");
            var results = await resultsResp.Content.ReadFromJsonAsync<List<SubmissionResultDto>>();
            Assert.NotNull(results);
            Assert.Contains(results, r => r.ExamId == createdExam.Id);
        }
    }
}
