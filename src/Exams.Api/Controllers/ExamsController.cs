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
    [Route("exams")]
    [Authorize]
    public class ExamsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ExamsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> Create([FromBody] CreateExamRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (req.EndsAt <= req.StartsAt)
            {
                return ValidationProblem("EndsAt debe ser posterior a StartsAt.");
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = Guid.TryParse(userIdStr, out var userId);

            var exam = new Exam
            {
                Title = req.Title.Trim(),
                Description = req.Description?.Trim() ?? string.Empty,
                DurationMinutes = req.DurationMinutes,
                StartsAt = req.StartsAt.ToUniversalTime(),
                EndsAt = req.EndsAt.ToUniversalTime(),
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Exams.Add(exam);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetById), new { id = exam.Id }, exam);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isTeacher = User.IsInRole("Teacher") || User.IsInRole("Admin");
            _ = Guid.TryParse(userIdStr, out var userId);

            // Fetch student group memberships if applicable
            var studentGroupIds = new HashSet<Guid>();
            if (!isTeacher)
            {
                studentGroupIds = (await _db.GroupMembers
                    .Where(gm => gm.UserId == userId)
                    .Select(gm => gm.GroupId)
                    .ToListAsync(ct)).ToHashSet();
            }

            var submissions = await _db.Submissions
                .Where(s => s.UserId == userId)
                .Select(s => s.ExamId)
                .ToListAsync(ct);
            var submittedExamIds = new HashSet<Guid>(submissions);

            var query = _db.Exams
                .Include(e => e.Questions)
                .Include(e => e.Assignments)
                .AsNoTracking();

            var examsList = await query.ToListAsync(ct);

            var results = examsList.Select(e =>
            {
                var isAssigned = isTeacher || e.Assignments.Any(a =>
                    (a.UserId.HasValue && a.UserId.Value == userId) ||
                    (a.GroupId.HasValue && studentGroupIds.Contains(a.GroupId.Value)));

                return new ExamSummaryDto(
                    e.Id,
                    e.Title,
                    e.Description,
                    e.DurationMinutes,
                    e.StartsAt,
                    e.EndsAt,
                    e.CreatedBy,
                    e.Questions.Count,
                    e.Questions.Sum(q => q.Points),
                    isAssigned,
                    submittedExamIds.Contains(e.Id)
                );
            }).ToList();

            // Students only see assigned exams or exams within their timeframe
            if (!isTeacher)
            {
                results = results.Where(r => r.IsAssigned).ToList();
            }

            return Ok(results);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        {
            var isTeacher = User.IsInRole("Teacher") || User.IsInRole("Admin");

            var exam = await _db.Exams
                .Include(e => e.Questions.OrderBy(q => q.Order))
                    .ThenInclude(q => q.Options)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id, ct);

            if (exam == null)
            {
                return NotFound(new { message = "Examen no encontrado." });
            }

            var questionDtos = exam.Questions.Select(q => new QuestionDto(
                q.Id,
                q.ExamId,
                q.Type.ToString(),
                q.Text,
                q.Points,
                q.Order,
                q.Options.Select(o => new OptionDto(
                    o.Id,
                    o.Text,
                    isTeacher ? o.IsCorrect : null // Security: NEVER leak IsCorrect to student!
                )).ToList()
            )).ToList();

            var detail = new ExamDetailDto(
                exam.Id,
                exam.Title,
                exam.Description,
                exam.DurationMinutes,
                exam.StartsAt,
                exam.EndsAt,
                exam.CreatedBy,
                exam.Questions.Count,
                exam.Questions.Sum(q => q.Points),
                questionDtos
            );

            return Ok(detail);
        }

        [HttpPost("{id:guid}/assign")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> AssignExam(Guid id, [FromBody] AssignExamRequest req, CancellationToken ct)
        {
            var examExists = await _db.Exams.AnyAsync(e => e.Id == id, ct);
            if (!examExists)
            {
                return NotFound(new { message = "Examen no encontrado." });
            }

            if (!req.GroupId.HasValue && !req.UserId.HasValue)
            {
                return BadRequest(new { message = "Debe especificar un GroupId o un UserId para asignar el examen." });
            }

            var assignment = new ExamAssignment
            {
                ExamId = id,
                GroupId = req.GroupId,
                UserId = req.UserId,
                AssignedAt = DateTime.UtcNow
            };

            _db.ExamAssignments.Add(assignment);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Examen asignado correctamente.", assignmentId = assignment.Id });
        }
    }
}
