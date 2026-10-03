using System;
using System.ComponentModel.DataAnnotations;
using Exams.Domain.Entities;

namespace Exams.Api.DTOs
{
    public record LoginRequest(
        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
        string Email,

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        string Password
    );

    public record RegisterRequest(
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(150, MinimumLength = 2)]
        string Name,

        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
        string Email,

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
        string Password,

        [Required]
        UserRole Role
    );

    public record UserDto(
        Guid Id,
        string Name,
        string Email,
        string Role
    );

    public record AuthResponse(
        string Token,
        UserDto User
    );
}
