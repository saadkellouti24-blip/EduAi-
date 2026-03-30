<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Course extends Model {
    protected $fillable = ['title', 'description', 'teacher_id'];
    
    public function chapters() {
        return $this->hasMany(Chapter::class);
    }
}

class Chapter extends Model {
    protected $fillable = ['course_id', 'title', 'content', 'order_index'];
}
