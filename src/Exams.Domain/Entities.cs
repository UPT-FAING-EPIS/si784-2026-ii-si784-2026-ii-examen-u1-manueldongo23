using System;
using System.Collections.Generic;

namespace Exams.Domain.Entities
{
    public enum UserRole
    {
        Student,
        Teacher,
        Admin
    }

    public enum QuestionType
    {
        MultipleChoice,
        TrueFalse,
        Open
    }

    public enum SubmissionStatus
    {
        InProgress,
        Submitted,
        Graded
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Student;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
        public ICollection<Exam> CreatedExams { get; set; } = new List<Exam>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }

    public class Group
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
        public ICollection<ExamAssignment> ExamAssignments { get; set; } = new List<ExamAssignment>();
    }

    public class GroupMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid GroupId { get; set; }
        public Group? Group { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }

    public class Exam
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DurationMinutes { get; set; } = 60;
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public Guid CreatedBy { get; set; }
        public User? Creator { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Question> Questions { get; set; } = new List<Question>();
        public ICollection<ExamAssignment> Assignments { get; set; } = new List<ExamAssignment>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }

    public class Question
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ExamId { get; set; }
        public Exam? Exam { get; set; }
        public QuestionType Type { get; set; } = QuestionType.MultipleChoice;
        public string Text { get; set; } = string.Empty;
        public int Points { get; set; } = 10;
        public int Order { get; set; } = 1;

        public ICollection<Option> Options { get; set; } = new List<Option>();
        public ICollection<Answer> Answers { get; set; } = new List<Answer>();
    }

    public class Option
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid QuestionId { get; set; }
        public Question? Question { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }

    public class ExamAssignment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ExamId { get; set; }
        public Exam? Exam { get; set; }
        public Guid? GroupId { get; set; }
        public Group? Group { get; set; }
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }

    public class Submission
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ExamId { get; set; }
        public Exam? Exam { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SubmittedAt { get; set; }
        public int Score { get; set; } = 0;
        public SubmissionStatus Status { get; set; } = SubmissionStatus.InProgress;

        public ICollection<Answer> Answers { get; set; } = new List<Answer>();
    }

    public class Answer
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SubmissionId { get; set; }
        public Submission? Submission { get; set; }
        public Guid QuestionId { get; set; }
        public Question? Question { get; set; }
        public Guid? OptionId { get; set; }
        public Option? Option { get; set; }
        public string? OpenText { get; set; }
        public int? PointsAwarded { get; set; }
        public string? Feedback { get; set; }
    }
}
