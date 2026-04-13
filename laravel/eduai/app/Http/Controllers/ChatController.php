<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    public function send(Request $request)
    {
        $apiKey = env('GROQ_KEY');

        $messages = [
            ['role' => 'system', 'content' => $request->system],
            ...collect($request->messages)->toArray()
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => 'llama-3.1-8b-instant',
            'messages' => $messages,
            'max_tokens' => 1000,
        ]);

        $data = $response->json();
        return response()->json($data);
    }
}