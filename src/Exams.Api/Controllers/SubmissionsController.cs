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
    [Route("submissions")]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SubmissionsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartSubmission([FromBody] StartSubmissionRequest req, CancellationToken ct)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var exam = await _db.Exams
                .Include(e => e.Questions.OrderBy(q => q.Order))
                    .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(e => e.Id == req.ExamId, ct);

            if (exam == null)
            {
                return NotFound(new { message = "Examen no encontrado." });
            }

            var now = DateTime.UtcNow;
            if (now < exam.StartsAt)
            {
                return BadRequest(new { message = $"El examen aún no ha iniciado. Comienza el: {exam.StartsAt:u}" });
            }
            if (now > exam.EndsAt)
            {
                return BadRequest(new { message = $"El examen ya ha finalizado. Terminó el: {exam.EndsAt:u}" });
            }

            // Check if user already submitted this exam
            var existingSubmission = await _db.Submissions
                .FirstOrDefaultAsync(s => s.ExamId == exam.Id && s.UserId == userId, ct);

            if (existingSubmission != null)
            {
                if (existingSubmission.Status != SubmissionStatus.InProgress)
                {
                    return BadRequest(new { message = "Ya has completado y enviado este examen previamente." });
                }

                // If already in progress, calculate remaining time
                var elapsedSeconds = (int)(now - existingSubmission.StartedAt).TotalSeconds;
                var totalAllowedSeconds = exam.DurationMinutes * 60;
                var remaining = Math.Max(0, totalAllowedSeconds - elapsedSeconds);

                var qDtos = exam.Questions.Select(q => new QuestionDto(
                    q.Id,
                    q.ExamId,
                    q.Type.ToString(),
                    q.Text,
                    q.Points,
                    q.Order,
                    q.Options.Select(o => new OptionDto(o.Id, o.Text, null)).ToList()
                )).ToList();

                return Ok(new SubmissionStartedResponse(
                    existingSubmission.Id,
                    exam.Id,
                    exam.Title,
                    exam.DurationMinutes,
                    existingSubmission.StartedAt,
                    remaining,
                    qDtos
                ));
            }

            var submission = new Submission
            {
                ExamId = exam.Id,
                UserId = userId,
                StartedAt = now,
                Status = SubmissionStatus.InProgress
            };

            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync(ct);

            var questions = exam.Questions.Select(q => new QuestionDto(
                q.Id,
                q.ExamId,
                q.Type.ToString(),
                q.Text,
                q.Points,
                q.Order,
                q.Options.Select(o => new OptionDto(o.Id, o.Text, null)).ToList()
            )).ToList();

            return Ok(new SubmissionStartedResponse(
                submission.Id,
                exam.Id,
                exam.Title,
                exam.DurationMinutes,
                submission.StartedAt,
                exam.DurationMinutes * 60,
                questions
            ));
        }

        [HttpPost]
        public async Task<IActionResult> SubmitAnswers([FromBody] SubmitExamRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = Guid.TryParse(userIdStr, out var userId);

            var submission = await _db.Submissions
                .Include(s => s.Exam)
                    .ThenInclude(e => e!.Questions)
                        .ThenInclude(q => q.Options)
                .Include(s => s.Answers)
                .FirstOrDefaultAsync(s => s.Id == req.SubmissionId, ct);

            if (submission == null)
            {
                return NotFound(new { message = "Sesión de entrega de examen no encontrada." });
            }

            if (submission.UserId != userId && !User.IsInRole("Teacher") && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            if (submission.Status != SubmissionStatus.InProgress)
            {
                return BadRequest(new { message = "El examen ya fue entregado previamente." });
            }

            var now = DateTime.UtcNow;
            var maxAllowedTime = submission.StartedAt.AddMinutes(submission.Exam!.DurationMinutes + 2); // 2 min grace period
            if (now > maxAllowedTime)
            {
                // Force submit with warning
            }

            submission.SubmittedAt = now;

            var questionsDict = submission.Exam.Questions.ToDictionary(q => q.Id);
            var totalScore = 0;
            var hasOpenQuestions = false;

            foreach (var ans in req.Answers)
            {
                if (!questionsDict.TryGetValue(ans.QuestionId, out var question))
                {
                    continue;
                }

                var answerEntity = new Answer
                {
                    SubmissionId = submission.Id,
                    QuestionId = question.Id,
                    OptionId = ans.OptionId,
                    OpenText = ans.OpenText?.Trim()
                };

                if (question.Type == QuestionType.MultipleChoice || question.Type == QuestionType.TrueFalse)
                {
                    var selectedOption = question.Options.FirstOrDefault(o => o.Id == ans.OptionId);
                    if (selectedOption != null && selectedOption.IsCorrect)
                    {
                        answerEntity.PointsAwarded = question.Points;
                        totalScore += question.Points;
                    }
                    else
                    {
                        answerEntity.PointsAwarded = 0;
                    }
                }
                else if (question.Type == QuestionType.Open)
                {
                    hasOpenQuestions = true;
                    answerEntity.PointsAwarded = null; // Awaiting teacher review
                }

                _db.Answers.Add(answerEntity);
            }

            submission.Score = totalScore;
            submission.Status = hasOpenQuestions ? SubmissionStatus.Submitted : SubmissionStatus.Graded;

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Examen entregado exitosamente.",
                submissionId = submission.Id,
                score = submission.Score,
                status = submission.Status.ToString(),
                submittedAt = submission.SubmittedAt
            });
        }

        [HttpPost("{id:guid}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeOpenAnswer(Guid id, [FromBody] GradeOpenAnswerRequest req, CancellationToken ct)
        {
            var submission = await _db.Submissions
                .Include(s => s.Answers)
                .Include(s => s.Exam)
                    .ThenInclude(e => e!.Questions)
                .FirstOrDefaultAsync(s => s.Id == id, ct);

            if (submission == null)
            {
                return NotFound(new { message = "Entrega no encontrada." });
            }

            var answer = submission.Answers.FirstOrDefault(a => a.Id == req.AnswerId);
            if (answer == null)
            {
                return NotFound(new { message = "Respuesta no encontrada en la entrega." });
            }

            answer.PointsAwarded = req.PointsAwarded;
            answer.Feedback = req.Feedback;

            // Recalculate total score
            submission.Score = submission.Answers.Sum(a => a.PointsAwarded ?? 0);

            // Check if any open answers remain unassigned
            var stillHasUngraded = submission.Answers.Any(a => a.PointsAwarded == null);
            if (!stillHasUngraded)
            {
                submission.Status = SubmissionStatus.Graded;
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Calificación registrada con éxito.",
                newScore = submission.Score,
                status = submission.Status.ToString()
            });
        }
    }
}
