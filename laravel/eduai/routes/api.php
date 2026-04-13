<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EdTechController;
use App\Http\Controllers\ChatController;

Route::post('/login', [EdTechController::class, 'login']);
Route::post('/chat', [ChatController::class, 'send']);
Route::delete('/courses/{id}', [EdTechController::class, 'deleteCourse']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/classes', [EdTechController::class, 'storeClass']);
    Route::get('/classes', [EdTechController::class, 'getClasses']);
    Route::post('/students', [EdTechController::class, 'addStudent']);
    Route::post('/courses', [EdTechController::class, 'storeCourse']);
    Route::get('/courses', [EdTechController::class, 'getCourses']);
});
