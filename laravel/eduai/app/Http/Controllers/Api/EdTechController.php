<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Course;

class EdTechController extends Controller {
    
    public function login(Request $request) {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }
        $user = User::where('email', $request->email)->firstOrFail();
        return response()->json(['user' => $user, 'token' => $user->createToken('auth')->plainTextToken]);
    }

    public function storeClass(Request $request) {
        $class = SchoolClass::create(['name' => $request->name, 'teacher_id' => auth()->id()]);
        return response()->json(['class' => $class]);
    }

    public function getClasses() {
        return response()->json(SchoolClass::with('students')->get());
    }

    public function addStudent(Request $request) {
        $student = User::create([
            'nom' => $request->nom, 'prenom' => $request->prenom,
            'email' => $request->email, 'password' => Hash::make('password123'),
            'role' => 'student', 'school_class_id' => $request->school_class_id
        ]);
        return response()->json(['student' => $student]);
    }

    public function storeCourse(Request $request) {
        $course = Course::create(['title' => $request->title, 'description' => $request->description, 'teacher_id' => auth()->id()]);
        foreach ($request->chapters as $index => $chapter) {
            $course->chapters()->create(['title' => $chapter['title'], 'content' => $chapter['content'], 'order_index' => $index]);
        }
        return response()->json(['course' => $course->load('chapters')]);
    }

    public function getCourses() {
        return response()->json(Course::with('chapters')->get());
    }
}
