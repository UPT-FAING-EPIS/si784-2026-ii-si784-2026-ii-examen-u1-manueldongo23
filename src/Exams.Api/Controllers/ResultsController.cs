using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Exams.Api.DTOs;
using Exams.Domain.Entities;
using Exams.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Exams.Api.Controllers
{
    [ApiController]
    [Route("results")]
    [Authorize]
    public class ResultsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ResultsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("{userId:guid}")]
        public async Task<IActionResult> GetUserResults(Guid userId, CancellationToken ct)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isTeacher = User.IsInRole("Teacher") || User.IsInRole("Admin");

            if (!Guid.TryParse(currentUserIdStr, out var currentUserId))
            {
                return Unauthorized();
            }

            // Security check: Only teacher/admin can view someone else's results
            if (!isTeacher && currentUserId != userId)
            {
                return Forbid();
            }

            var submissions = await _db.Submissions
                .Where(s => s.UserId == userId && s.Status != SubmissionStatus.InProgress)
                .Include(s => s.User)
                .Include(s => s.Exam)
                    .ThenInclude(e => e!.Questions)
                        .ThenInclude(q => q.Options)
                .Include(s => s.Answers)
                    .ThenInclude(a => a.Option)
                .OrderByDescending(s => s.SubmittedAt)
                .AsNoTracking()
                .ToListAsync(ct);

            var resultDtos = submissions.Select(s =>
            {
                var answers = s.Answers.Select(a =>
                {
                    var question = s.Exam?.Questions.FirstOrDefault(q => q.Id == a.QuestionId);
                    var correctOpt = question?.Options.FirstOrDefault(o => o.IsCorrect);

                    return new AnswerResultDto(
                        a.QuestionId,
                        question?.Text ?? string.Empty,
                        question?.Type.ToString() ?? string.Empty,
                        question?.Points ?? 0,
                        a.OptionId,
                        a.Option?.Text,
                        correctOpt?.Text,
                        a.OpenText,
                        a.PointsAwarded,
                        a.PointsAwarded.HasValue ? a.PointsAwarded.Value > 0 : null,
                        a.Feedback
                    );
                }).ToList();

                var totalPossible = s.Exam?.Questions.Sum(q => q.Points) ?? 0;

                return new SubmissionResultDto(
                    s.Id,
                    s.ExamId,
                    s.Exam?.Title ?? "Examen",
                    s.UserId,
                    s.User?.Name ?? "Estudiante",
                    s.StartedAt,
                    s.SubmittedAt,
                    s.Score,
                    totalPossible,
                    s.Status.ToString(),
                    answers
                );
            }).ToList();

            return Ok(resultDtos);
        }

        [HttpGet("exam/{examId:guid}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetExamResults(Guid examId, CancellationToken ct)
        {
            var exam = await _db.Exams.FindAsync(new object[] { examId }, ct);
            if (exam == null)
            {
                return NotFound(new { message = "Examen no encontrado." });
            }

            var submissions = await _db.Submissions
                .Where(s => s.ExamId == examId && s.Status != SubmissionStatus.InProgress)
                .Include(s => s.User)
                .Include(s => s.Exam)
                    .ThenInclude(e => e!.Questions)
                        .ThenInclude(q => q.Options)
                .Include(s => s.Answers)
                    .ThenInclude(a => a.Option)
                .OrderByDescending(s => s.SubmittedAt)
                .AsNoTracking()
                .ToListAsync(ct);

            var resultDtos = submissions.Select(s =>
            {
                var answers = s.Answers.Select(a =>
                {
                    var question = s.Exam?.Questions.FirstOrDefault(q => q.Id == a.QuestionId);
                    var correctOpt = question?.Options.FirstOrDefault(o => o.IsCorrect);

                    return new AnswerResultDto(
                        a.QuestionId,
                        question?.Text ?? string.Empty,
                        question?.Type.ToString() ?? string.Empty,
                        question?.Points ?? 0,
                        a.OptionId,
                        a.Option?.Text,
                        correctOpt?.Text,
                        a.OpenText,
                        a.PointsAwarded,
                        a.PointsAwarded.HasValue ? a.PointsAwarded.Value > 0 : null,
                        a.Feedback
                    );
                }).ToList();

                var totalPossible = s.Exam?.Questions.Sum(q => q.Points) ?? 0;

                return new SubmissionResultDto(
                    s.Id,
                    s.ExamId,
                    s.Exam?.Title ?? exam.Title,
                    s.UserId,
                    s.User?.Name ?? "Estudiante",
                    s.StartedAt,
                    s.SubmittedAt,
                    s.Score,
                    totalPossible,
                    s.Status.ToString(),
                    answers
                );
            }).ToList();

            return Ok(resultDtos);
        }
    }
}
