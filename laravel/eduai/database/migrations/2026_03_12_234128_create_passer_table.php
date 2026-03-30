<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('passer', function (Blueprint $table) {
    $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
    $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
    $table->decimal('note', 15, 2)->nullable();
    $table->date('date_passage')->nullable();
    $table->primary(['student_id', 'quiz_id']);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('passer');
    }
};
