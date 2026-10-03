using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Exams.Domain.Entities;

namespace Exams.Api.DTOs
{
    public record CreateExamRequest(
        [Required(ErrorMessage = "El título es obligatorio.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "El título debe tener entre 3 y 150 caracteres.")]
        string Title,

        [StringLength(1000, ErrorMessage = "La descripción no puede exceder 1000 caracteres.")]
        string? Description,

        [Range(1, 480, ErrorMessage = "La duración debe estar entre 1 y 480 minutos.")]
        int DurationMinutes,

        [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
        DateTime StartsAt,

        [Required(ErrorMessage = "La fecha de fin es obligatoria.")]
        DateTime EndsAt
    );

    public record AssignExamRequest(
        Guid? GroupId,
        Guid? UserId
    );

    public record OptionDto(
        Guid Id,
        string Text,
        bool? IsCorrect
    );

    public record QuestionDto(
        Guid Id,
        Guid ExamId,
        string Type,
        string Text,
        int Points,
        int Order,
        List<OptionDto> Options
    );

    public record ExamDetailDto(
        Guid Id,
        string Title,
        string Description,
        int DurationMinutes,
        DateTime StartsAt,
        DateTime EndsAt,
        Guid CreatedBy,
        int TotalQuestions,
        int TotalPoints,
        List<QuestionDto> Questions
    );

    public record ExamSummaryDto(
        Guid Id,
        string Title,
        string Description,
        int DurationMinutes,
        DateTime StartsAt,
        DateTime EndsAt,
        Guid CreatedBy,
        int TotalQuestions,
        int TotalPoints,
        bool IsAssigned,
        bool HasSubmitted
    );
}
