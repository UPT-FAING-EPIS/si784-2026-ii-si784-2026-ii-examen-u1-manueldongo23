using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Exams.Api.DTOs
{
    public record CreateOptionDto(
        [Required(ErrorMessage = "El texto de la opción es obligatorio.")]
        [StringLength(1000)]
        string Text,

        bool IsCorrect
    );

    public record CreateQuestionRequest(
        [Required(ErrorMessage = "El Id del examen es obligatorio.")]
        Guid ExamId,

        [Required(ErrorMessage = "El tipo de pregunta es obligatorio (MultipleChoice, TrueFalse, Open).")]
        string Type,

        [Required(ErrorMessage = "El enunciado de la pregunta es obligatorio.")]
        [StringLength(2000, MinimumLength = 3, ErrorMessage = "El enunciado debe tener entre 3 y 2000 caracteres.")]
        string Text,

        [Range(1, 100, ErrorMessage = "Los puntos deben estar entre 1 y 100.")]
        int Points,

        int Order,

        List<CreateOptionDto>? Options
    );
}
