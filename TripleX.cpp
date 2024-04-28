#include <iostream>
#include <ctime>
void PrintIntroduction(int Difficulty)
{
	std::cout << "Welcome to TripleX Game " << std::endl;
	std::cout << "You are a secret agent breaking into a level  " << Difficulty;
	std::cout << "  secure server room." << std::endl;

	std::cout << R"(

 _________        .---"""_____ """---.              
:______.-':      :  .--------------.  :             
| ______  |      | :                : |             
|:______B:|      | |  TripleX Game  | |             
|:______B:|      | |                | |             
|:______B:|      | |   By Tarek     | |             
|         |      | |       Hatem    | |             
|:_____:  |      | |                | |             
|    ==   |      | :                : |             
|       O |      :  '--------------'  :             
|       o |      :'---...______...---'              
|       o |-._.-i___/'             \._              
|'-.____o_|   '-.   '-...______...-'  `-._          
:_________:      `.____________________   `-.___.-. 
                 .'.eeeeeeeeeeeeeeeeee.'.      :___:
              .'.eeeeeeeeeeeeeeeeeeeeee.'.         
             :____________________________:
           
)" << '\n';
	std::cout << "Enter the correct code to continue...\n\n";

}
bool PlayGame(int Difficulty) 
{
	PrintIntroduction(Difficulty);
	//Declaration of the hidden code
	const int CodeA(rand() % Difficulty + Difficulty);
	const int CodeB(rand() % Difficulty + Difficulty);
	const int CodeC(rand() % Difficulty + Difficulty);

	//expression statements
	const int CodeSum = CodeA + CodeB + CodeC;
	const int CodeProduct = CodeA * CodeB * CodeC;
	
	std::cout << std::endl;
	std::cout << "There are three numbers in the code \n ";
	std::cout << "\n The codes add-up to :  " << CodeSum << std::endl;
	std::cout << "\n The codes multiply to  " << CodeProduct << std::endl;


	int GuessA, GuessB, GuessC;
	std::cout << "\n Now guess the code then hit enter. "<<std::endl;
	std::cin >> GuessA >> GuessB >> GuessC;


	int GuessSum = GuessA + GuessB + GuessC;
	int GuessProduct = GuessA * GuessB * GuessC;

	//check if the PlayerGuess is correct
	if (GuessProduct == CodeProduct && GuessSum == CodeSum)
	{
		std::cout << "\n *** Well done Agent 47 ! You have extracted a file ! Onward ! ***";
		return true;
	}
	else
		std::cout << "\n *** You entered the wrong code! Careful 47 ! Try again. *** "<<std::endl;
	return false;
}


int main ()
{
	srand(time(NULL));
	int LevelDifficulty(1);
	int const MaxDifficulty(5);

	while (LevelDifficulty <= MaxDifficulty) //Loopthe game until all the levels are competed
	{
		bool bLevelComplete=PlayGame(LevelDifficulty);
		std::cin.clear();
		std::cin.ignore();

		if (bLevelComplete)
		{
			++LevelDifficulty;
		}
		
	}
	
	std::cout << " *** Good Job, Agent 47! You got all the files ! Now get out of there ! ***\n ";
	return 0;

}