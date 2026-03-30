<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up() {
    Schema::create('courses', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description')->nullable();
        $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
        $table->timestamps();
    });

    Schema::create('chapters', function (Blueprint $table) {
        $table->id();
        $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
        $table->string('title');
        $table->longText('content');
        $table->integer('order_index')->default(0);
        $table->timestamps();
    });
}
};
