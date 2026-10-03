using Microsoft.EntityFrameworkCore;
using Exams.Domain.Entities;

namespace Exams.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Group> Groups => Set<Group>();
        public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
        public DbSet<Exam> Exams => Set<Exam>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<Option> Options => Set<Option>();
        public DbSet<ExamAssignment> ExamAssignments => Set<ExamAssignment>();
        public DbSet<Submission> Submissions => Set<Submission>();
        public DbSet<Answer> Answers => Set<Answer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User config
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Name).IsRequired().HasMaxLength(150);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
                entity.Property(u => u.Role).HasConversion<string>();
            });

            // Group config
            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.Property(g => g.Name).IsRequired().HasMaxLength(150);
            });

            // GroupMember config
            modelBuilder.Entity<GroupMember>(entity =>
            {
                entity.HasKey(gm => gm.Id);
                entity.HasOne(gm => gm.Group)
                      .WithMany(g => g.Members)
                      .HasForeignKey(gm => gm.GroupId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(gm => gm.User)
                      .WithMany(u => u.GroupMemberships)
                      .HasForeignKey(gm => gm.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(gm => new { gm.GroupId, gm.UserId }).IsUnique();
            });

            // Exam config
            modelBuilder.Entity<Exam>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);

                entity.HasOne(e => e.Creator)
                      .WithMany(u => u.CreatedExams)
                      .HasForeignKey(e => e.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Question config
            modelBuilder.Entity<Question>(entity =>
            {
                entity.HasKey(q => q.Id);
                entity.Property(q => q.Text).IsRequired().HasMaxLength(2000);
                entity.Property(q => q.Type).HasConversion<string>();

                entity.HasOne(q => q.Exam)
                      .WithMany(e => e.Questions)
                      .HasForeignKey(q => q.ExamId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Option config
            modelBuilder.Entity<Option>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.Text).IsRequired().HasMaxLength(1000);

                entity.HasOne(o => o.Question)
                      .WithMany(q => q.Options)
                      .HasForeignKey(o => o.QuestionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ExamAssignment config
            modelBuilder.Entity<ExamAssignment>(entity =>
            {
                entity.HasKey(ea => ea.Id);

                entity.HasOne(ea => ea.Exam)
                      .WithMany(e => e.Assignments)
                      .HasForeignKey(ea => ea.ExamId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ea => ea.Group)
                      .WithMany(g => g.ExamAssignments)
                      .HasForeignKey(ea => ea.GroupId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ea => ea.User)
                      .WithMany()
                      .HasForeignKey(ea => ea.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Submission config
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Status).HasConversion<string>();

                entity.HasOne(s => s.Exam)
                      .WithMany(e => e.Submissions)
                      .HasForeignKey(s => s.ExamId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(s => s.User)
                      .WithMany(u => u.Submissions)
                      .HasForeignKey(s => s.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Answer config
            modelBuilder.Entity<Answer>(entity =>
            {
                entity.HasKey(a => a.Id);

                entity.HasOne(a => a.Submission)
                      .WithMany(s => s.Answers)
                      .HasForeignKey(a => a.SubmissionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(a => a.Question)
                      .WithMany(q => q.Answers)
                      .HasForeignKey(a => a.QuestionId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Option)
                      .WithMany()
                      .HasForeignKey(a => a.OptionId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
