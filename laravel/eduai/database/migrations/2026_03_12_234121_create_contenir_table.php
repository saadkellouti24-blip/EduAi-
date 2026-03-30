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
        Schema::create('contenir', function (Blueprint $table) {
    $table->foreignId('cour_id')->constrained('cours')->onDelete('cascade');
    $table->foreignId('quiz_id')->constrained('quizzes')->onDelete('cascade');
    $table->primary(['cour_id', 'quiz_id']);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contenir');
    }
};
