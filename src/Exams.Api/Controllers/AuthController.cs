using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Exams.Api.DTOs;
using Exams.Api.Services;
using Exams.Domain.Entities;
using Exams.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Exams.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenService _tokenService;

        public AuthController(AppDbContext db, IJwtTokenService tokenService)
        {
            _db = db;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email.ToLower(), ct);
            if (user == null || !DbInitializer.VerifyPassword(req.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Credenciales inválidas." });
            }

            var token = _tokenService.GenerateToken(user);
            var userDto = new UserDto(user.Id, user.Name, user.Email, user.Role.ToString());

            return Ok(new AuthResponse(token, userDto));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower(), ct);
            if (exists)
            {
                return Conflict(new { message = "El correo ya está registrado." });
            }

            var user = new User
            {
                Name = req.Name.Trim(),
                Email = req.Email.Trim().ToLowerInvariant(),
                PasswordHash = DbInitializer.HashPassword(req.Password),
                Role = req.Role,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);

            var token = _tokenService.GenerateToken(user);
            var userDto = new UserDto(user.Id, user.Name, user.Email, user.Role.ToString());

            return CreatedAtAction(nameof(GetMe), new AuthResponse(token, userDto));
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe(CancellationToken ct)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var user = await _db.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(new UserDto(user.Id, user.Name, user.Email, user.Role.ToString()));
        }
    }
}
