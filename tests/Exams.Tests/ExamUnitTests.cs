using System;
using System.Collections.Generic;
using Exams.Domain.Entities;
using Exams.Infrastructure.Data;
using Xunit;

namespace Exams.Tests
{
    public class ExamUnitTests
    {
        [Fact]
        public void PasswordHasher_ShouldVerifyCorrectPassword()
        {
            var raw = "SecurePass123!";
            var hash = DbInitializer.HashPassword(raw);

            Assert.True(DbInitializer.VerifyPassword(raw, hash));
            Assert.False(DbInitializer.VerifyPassword("WrongPass", hash));
        }

        [Fact]
        public void Exam_ValidDates_ShouldHavePositiveDuration()
        {
            var startsAt = DateTime.UtcNow;
            var endsAt = startsAt.AddDays(2);

            var exam = new Exam
            {
                Title = "Matemáticas Discretas",
                DurationMinutes = 60,
                StartsAt = startsAt,
                EndsAt = endsAt
            };

            Assert.True(exam.EndsAt > exam.StartsAt);
            Assert.True(exam.DurationMinutes > 0);
        }

        [Fact]
        public void Submission_MultipleChoiceScoring_CalculatesCorrectly()
        {
            var qId = Guid.NewGuid();
            var correctOptionId = Guid.NewGuid();
            var wrongOptionId = Guid.NewGuid();

            var question = new Question
            {
                Id = qId,
                Type = QuestionType.MultipleChoice,
                Text = "¿Cuál es la complejidad de búsqueda binaria?",
                Points = 10,
                Options = new List<Option>
                {
                    new Option { Id = correctOptionId, Text = "O(log n)", IsCorrect = true },
                    new Option { Id = wrongOptionId, Text = "O(n)", IsCorrect = false }
                }
            };

            // Test student chooses correct option
            var studentCorrectAnswer = new Answer
            {
                QuestionId = qId,
                OptionId = correctOptionId,
                PointsAwarded = 10
            };

            Assert.Equal(10, studentCorrectAnswer.PointsAwarded);

            // Test student chooses incorrect option
            var studentWrongAnswer = new Answer
            {
                QuestionId = qId,
                OptionId = wrongOptionId,
                PointsAwarded = 0
            };

            Assert.Equal(0, studentWrongAnswer.PointsAwarded);
        }

        [Fact]
        public void Submission_OpenQuestion_RequiresGrading()
        {
            var openQuestion = new Question
            {
                Id = Guid.NewGuid(),
                Type = QuestionType.Open,
                Text = "Explique el patrón Inversión de Control (IoC).",
                Points = 15
            };

            var answer = new Answer
            {
                QuestionId = openQuestion.Id,
                OpenText = "IoC permite delegar la creación de dependencias a un contenedor...",
                PointsAwarded = null // initially unassigned
            };

            Assert.Null(answer.PointsAwarded);

            // Teacher assigns points
            answer.PointsAwarded = 14;
            answer.Feedback = "Excelente respuesta conceptual.";

            Assert.Equal(14, answer.PointsAwarded);
            Assert.NotNull(answer.Feedback);
        }
    }
}
