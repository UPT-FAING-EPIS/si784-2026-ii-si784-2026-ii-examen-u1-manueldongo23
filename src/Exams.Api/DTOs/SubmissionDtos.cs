using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Exams.Api.DTOs
{
    public record StartSubmissionRequest(
        [Required] Guid ExamId
    );

    public record SubmissionStartedResponse(
        Guid SubmissionId,
        Guid ExamId,
        string ExamTitle,
        int DurationMinutes,
        DateTime StartedAt,
        int RemainingSeconds,
        List<QuestionDto> Questions
    );

    public record SubmitAnswerDto(
        [Required] Guid QuestionId,
        Guid? OptionId,
        [StringLength(4000)] string? OpenText
    );

    public record SubmitExamRequest(
        [Required] Guid SubmissionId,
        [Required] List<SubmitAnswerDto> Answers
    );

    public record GradeOpenAnswerRequest(
        [Required] Guid AnswerId,
        [Range(0, 100)] int PointsAwarded,
        [StringLength(1000)] string? Feedback
    );

    public record AnswerResultDto(
        Guid QuestionId,
        string QuestionText,
        string QuestionType,
        int QuestionPoints,
        Guid? SelectedOptionId,
        string? SelectedOptionText,
        string? CorrectOptionText,
        string? OpenAnswerText,
        int? PointsAwarded,
        bool? IsCorrect,
        string? Feedback
    );

    public record SubmissionResultDto(
        Guid SubmissionId,
        Guid ExamId,
        string ExamTitle,
        Guid UserId,
        string UserName,
        DateTime StartedAt,
        DateTime? SubmittedAt,
        int Score,
        int TotalPossibleScore,
        string Status,
        List<AnswerResultDto> Answers
    );
}
