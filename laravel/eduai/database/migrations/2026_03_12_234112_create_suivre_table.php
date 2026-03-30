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
        Schema::create('suivre', function (Blueprint $table) {
    $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
    $table->foreignId('cour_id')->constrained('cours')->onDelete('cascade');
    $table->primary(['student_id', 'cour_id']); // Clé primaire composée
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suivre');
    }
};
