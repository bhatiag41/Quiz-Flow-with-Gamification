import React, { useState, useEffect } from 'react';

// Fallback data in case API fails
const FALLBACK_DATA = {
  questions: [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: "Mars"
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4"
    }
  ]
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  button: {
    background: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '5px',
    width: '100%',
    textAlign: 'left',
    fontSize: '16px',
  },
  startButton: {
    background: '#2196F3',
    width: 'auto',
    textAlign: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '4px',
  },
  question: {
    fontSize: '18px',
    marginBottom: '20px',
  },
  answerReview: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: '20px',
  }
};

const QuizApp = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('start');
  const [timer, setTimer] = useState(30);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch('https://quiz-flow-with-gamification.onrender.com/api/quiz');
        
        if (!response.ok) throw new Error('Failed to fetch quiz data');
        const data = await response.json();
        
        if (!data.questions || !Array.isArray(data.questions)) {
          throw new Error('Invalid quiz data format');
        }
        const transformedData = {
          questions: data.questions.map((q) => ({
            question: q.description,
            options: q.options.map((opt) => opt.description),
            correctAnswer: q.options.find((opt) => opt.is_correct)?.description || '',
          })),
        };
  
        setQuizData(transformedData);
      } catch (error) {
        console.error('Error:', error);
        setQuizData(FALLBACK_DATA); 
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchQuiz();
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      handleAnswerSubmit(null);
    }
    return () => clearInterval(interval);
  }, [timer, gameState]);

  const startQuiz = () => {
    setGameState('playing');
    setTimer(30);
    setScore(0);
    setCurrentQuestion(0);
    setStreak(0);
    setAnswers([]);
  };

  const handleAnswerSubmit = (selectedAnswer) => {
    if (!quizData) return;

    const currentQuestionData = quizData.questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;

    if (isCorrect) {
      setStreak(prev => prev + 1);
      const timeBonus = Math.floor(timer / 5);
      const streakBonus = Math.floor(streak / 2);
      setScore(prev => prev + 10 + timeBonus + streakBonus);
    } else {
      setStreak(0);
    }

    setAnswers(prev => [...prev, {
      question: currentQuestionData.question,
      selectedAnswer,
      correctAnswer: currentQuestionData.correctAnswer,
      isCorrect
    }]);

    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(prev => prev + 1);
      setTimer(30);
    } else {
      setGameState('results');
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Error loading quiz. Please try again.
          <button 
            style={{...styles.button, ...styles.startButton}}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1>
            {gameState === 'start' && "Welcome to the Quiz!"}
            {gameState === 'playing' && `Question ${currentQuestion + 1}`}
            {gameState === 'results' && "Quiz Results"}
          </h1>
        </div>

        {gameState === 'start' && (
          <div style={{textAlign: 'center'}}>
            <p>Test your knowledge and earn points!</p>
            <ul style={{listStyle: 'none', padding: '0', marginBottom: '20px'}}>
              <li>⏱️ Answer quickly for time bonuses</li>
              <li>🔥 Build streaks for extra points</li>
              <li>🏆 Compete for high scores</li>
            </ul>
            <button 
              onClick={startQuiz}
              style={{...styles.button, ...styles.startButton}}
            >
              Start Quiz
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div style={styles.statsBar}>
              <span>Score: {score}</span>
              <span>Streak: {streak}</span>
              <span>Time: {timer}s</span>
            </div>
            
            <div style={styles.question}>
              {quizData.questions[currentQuestion].question}
            </div>

            <div>
              {quizData.questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSubmit(option)}
                  style={styles.button}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <h2>Final Score: {score}</h2>
              <p>{score > 50 ? "Great job! 🎉" : "Good effort! 👍"}</p>
            </div>

            <div>
              <h3>Question Review:</h3>
              {answers.map((answer, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.answerReview,
                    background: answer.isCorrect ? '#e8f5e9' : '#ffebee'
                  }}
                >
                  <p><strong>Q{index + 1}:</strong> {answer.question}</p>
                  <p>Your answer: {answer.selectedAnswer}</p>
                  {!answer.isCorrect && (
                    <p style={{color: 'red'}}>
                      Correct answer: {answer.correctAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={startQuiz}
              style={{...styles.button, ...styles.startButton, marginTop: '20px'}}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizApp;