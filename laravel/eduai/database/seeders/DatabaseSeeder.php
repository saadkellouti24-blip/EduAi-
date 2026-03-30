<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        
        $profUser = User::create([
            'nom' => 'Alaoui',
            'prenom' => 'Mohammed',
            'email' => 'prof@eduai.com',
            'password' => Hash::make('password123'),
            'role' => 'prof',
            'statut' => 1,
        ]);

        $profId = DB::table('profs')->insertGetId([
            'user_id' => $profUser->id,
            'specialite' => 'Informatique',
            'grade' => 'Professeur principal',
            'date_embauch' => Carbon::now()->format('Y-m-d'),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);


    
        $classeId = DB::table('classes')->insertGetId([
            'nom_class' => '1ère Année Dev',
            'annee_scolaire' => date('Y'),
            'prof_id' => $profId, 
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);


        
        $studentUser = User::create([
            'nom' => 'Naciri',
            'prenom' => 'Ayoub',
            'email' => 'student@eduai.com',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'statut' => 1,
        ]);

        DB::table('students')->insert([
            'user_id' => $studentUser->id,
            'niveau' => '1ère Année',
            'date_inscription' => Carbon::now()->format('Y-m-d'),
            'classe_id' => $classeId, 
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}