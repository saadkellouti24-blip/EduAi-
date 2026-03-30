<?php


namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    public function index() {
        // Renvoie tous les cours avec leurs chapitres
        return response()->json(Course::with('chapters')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request) {
        $request->validate([
            'title' => 'required|string',
            'chapters' => 'required|array'
        ]);

        $course = Course::create([
            'title' => $request->title,
            'description' => $request->description,
            'teacher_id' => auth()->id() // Le prof connecté
        ]);

        foreach ($request->chapters as $index => $chapterData) {
            $course->chapters()->create([
                'title' => $chapterData['title'],
                'content' => $chapterData['content'],
                'order_index' => $index
            ]);
        }

        return response()->json(['message' => 'Cours créé', 'course' => $course->load('chapters')], 201);
    }
}
