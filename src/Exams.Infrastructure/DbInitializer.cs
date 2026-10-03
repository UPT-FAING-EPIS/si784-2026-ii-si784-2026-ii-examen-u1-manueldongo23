using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Exams.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exams.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "ExamSalt2026"));
            return Convert.ToBase64String(bytes);
        }

        public static bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }

        public static void Initialize(AppDbContext context)
        {
            if (context.Database.IsRelational())
            {
                context.Database.EnsureCreated();
            }
            else
            {
                context.Database.EnsureCreated();
            }

            if (context.Users.Any())
            {
                return; // DB has been seeded
            }

            // Seed Users
            var teacherId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var studentId = Guid.Parse("22222222-2222-2222-2222-222222222222");

            var teacher = new User
            {
                Id = teacherId,
                Name = "Prof. Carlos Mendoza",
                Email = "teacher@exams.com",
                PasswordHash = HashPassword("Teacher123!"),
                Role = UserRole.Teacher,
                CreatedAt = DateTime.UtcNow
            };

            var student = new User
            {
                Id = studentId,
                Name = "Ana Gómez",
                Email = "student@exams.com",
                PasswordHash = HashPassword("Student123!"),
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(teacher, student);

            // Seed Group
            var group = new Group
            {
                Id = Guid.NewGuid(),
                Name = "Ingeniería de Software - Grupo 01",
                Description = "Estudiantes del curso de Arquitectura y Desarrollo de Software",
                CreatedAt = DateTime.UtcNow
            };
            context.Groups.Add(group);

            var groupMember = new GroupMember
            {
                GroupId = group.Id,
                UserId = student.Id
            };
            context.GroupMembers.Add(groupMember);

            // Seed Exam
            var examId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var exam = new Exam
            {
                Id = examId,
                Title = "Examen Parcial: Arquitectura en la Nube y DevOps",
                Description = "Evaluación de conocimientos sobre contenedores, pipelines CI/CD e infraestructura como código.",
                DurationMinutes = 45,
                StartsAt = DateTime.UtcNow.AddDays(-1),
                EndsAt = DateTime.UtcNow.AddDays(7),
                CreatedBy = teacher.Id,
                CreatedAt = DateTime.UtcNow
            };
            context.Exams.Add(exam);

            // Seed Questions
            var q1 = new Question
            {
                Id = Guid.NewGuid(),
                ExamId = exam.Id,
                Order = 1,
                Points = 5,
                Type = QuestionType.MultipleChoice,
                Text = "¿Cuál es el propósito principal de un archivo Dockerfile multi-stage?",
                Options = new List<Option>
                {
                    new Option { Text = "Compilar y empaquetar reduciendo el tamaño final de la imagen", IsCorrect = true },
                    new Option { Text = "Permitir múltiples sistemas operativos en el mismo contenedor", IsCorrect = false },
                    new Option { Text = "Acelerar la velocidad de descarga de la base de datos", IsCorrect = false },
                    new Option { Text = "Reemplazar los servicios de orquestación de Kubernetes", IsCorrect = false }
                }
            };

            var q2 = new Question
            {
                Id = Guid.NewGuid(),
                ExamId = exam.Id,
                Order = 2,
                Points = 5,
                Type = QuestionType.TrueFalse,
                Text = "Terraform utiliza un archivo de estado (state file) para rastrear y sincronizar los recursos reales con la configuración declarativa.",
                Options = new List<Option>
                {
                    new Option { Text = "Verdadero", IsCorrect = true },
                    new Option { Text = "Falso", IsCorrect = false }
                }
            };

            var q3 = new Question
            {
                Id = Guid.NewGuid(),
                ExamId = exam.Id,
                Order = 3,
                Points = 10,
                Type = QuestionType.Open,
                Text = "Explique brevemente cómo una política de Quality Gate en SonarCloud ayuda a prevenir vulnerabilidades en producción.",
                Options = new List<Option>()
            };

            context.Questions.AddRange(q1, q2, q3);

            // Assign Exam to Student and Group
            context.ExamAssignments.Add(new ExamAssignment
            {
                ExamId = exam.Id,
                GroupId = group.Id,
                UserId = student.Id
            });

            context.SaveChanges();
        }
    }
}
