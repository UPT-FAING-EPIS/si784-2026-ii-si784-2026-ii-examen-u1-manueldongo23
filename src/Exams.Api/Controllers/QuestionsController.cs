using System;
using System.Collections.Generic;
using System.Linq;
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
    [Route("questions")]
    [Authorize]
    public class QuestionsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public QuestionsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> Create([FromBody] CreateQuestionRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exam = await _db.Exams.FindAsync(new object[] { req.ExamId }, ct);
            if (exam == null)
            {
                return NotFound(new { message = "El examen especificado no existe." });
            }

            if (!Enum.TryParse<QuestionType>(req.Type, true, out var questionType))
            {
                return BadRequest(new { message = $"Tipo de pregunta inválido: {req.Type}. Valores permitidos: MultipleChoice, TrueFalse, Open." });
            }

            // Validation rules for question types
            if (questionType == QuestionType.MultipleChoice)
            {
                if (req.Options == null || req.Options.Count < 2)
                {
                    return BadRequest(new { message = "Las preguntas de opción múltiple deben tener al menos 2 opciones." });
                }
                if (!req.Options.Any(o => o.IsCorrect))
                {
                    return BadRequest(new { message = "Debe marcar al menos una opción como correcta." });
                }
            }
            else if (questionType == QuestionType.TrueFalse)
            {
                if (req.Options == null || req.Options.Count != 2)
                {
                    return BadRequest(new { message = "Las preguntas de verdadero/falso deben contener exactamente 2 opciones." });
                }
                if (req.Options.Count(o => o.IsCorrect) != 1)
                {
                    return BadRequest(new { message = "Exactamente una opción debe ser marcada como correcta para verdadero/falso." });
                }
            }

            var question = new Question
            {
                ExamId = req.ExamId,
                Type = questionType,
                Text = req.Text.Trim(),
                Points = req.Points,
                Order = req.Order > 0 ? req.Order : (await _db.Questions.CountAsync(q => q.ExamId == req.ExamId, ct) + 1),
                Options = req.Options?.Select(o => new Option
                {
                    Text = o.Text.Trim(),
                    IsCorrect = o.IsCorrect
                }).ToList() ?? new List<Option>()
            };

            _db.Questions.Add(question);
            await _db.SaveChangesAsync(ct);

            var createdDto = new QuestionDto(
                question.Id,
                question.ExamId,
                question.Type.ToString(),
                question.Text,
                question.Points,
                question.Order,
                question.Options.Select(o => new OptionDto(o.Id, o.Text, o.IsCorrect)).ToList()
            );

            return CreatedAtAction(nameof(GetByExamId), new { examId = question.ExamId }, createdDto);
        }

        [HttpGet("{examId:guid}")]
        public async Task<IActionResult> GetByExamId(Guid examId, CancellationToken ct)
        {
            var isTeacher = User.IsInRole("Teacher") || User.IsInRole("Admin");

            var examExists = await _db.Exams.AnyAsync(e => e.Id == examId, ct);
            if (!examExists)
            {
                return NotFound(new { message = "Examen no encontrado." });
            }

            var questions = await _db.Questions
                .Where(q => q.ExamId == examId)
                .OrderBy(q => q.Order)
                .Include(q => q.Options)
                .AsNoTracking()
                .ToListAsync(ct);

            var dtos = questions.Select(q => new QuestionDto(
                q.Id,
                q.ExamId,
                q.Type.ToString(),
                q.Text,
                q.Points,
                q.Order,
                q.Options.Select(o => new OptionDto(
                    o.Id,
                    o.Text,
                    isTeacher ? o.IsCorrect : null // Security: NEVER return IsCorrect to student
                )).ToList()
            )).ToList();

            return Ok(dtos);
        }
    }
}
