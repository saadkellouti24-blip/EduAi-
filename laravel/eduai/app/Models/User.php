<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['nom', 'prenom', 'email', 'password', 'role', 'statut', 'school_class_id'];
    protected $hidden = ['password', 'remember_token'];

    public function taughtClasses() {
        return $this->hasMany(SchoolClass::class, 'teacher_id');
    }

    public function schoolClass() {
        return $this->belongsTo(SchoolClass::class);
    }
}
