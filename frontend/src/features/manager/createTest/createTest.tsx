import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { fetchTechnologies } from '../../../services/technology.service';
import { Technology } from '../../../interfaces/technology.interface';
import { Question } from '../../../interfaces/question.interface';
import { useAuth } from '../../../context/authContext';



const AddTestForm: React.FC = () => {
    const [technologies, setTechnologies] = useState<Technology[]>([]);
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState(1);
    const [technology, setTechnology] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [duration, setDuration] = useState(60);
    const [questions, setQuestions] = useState<Question[]>([
        { questionText: '', options: ['', '', '', ''], correctAnswer: '', points: 1 }
    ]);
    const { user } = useAuth();

    useEffect(() => {
        fetchTechnologies()
            .then(setTechnologies)
            .catch(() => toast.error('Erreur lors du chargement des technologies'));
    }, []);



    // Ajouter une nouvelle question au tableau de questions
    const handleAddQuestion = () => {
        setQuestions(prevQuestions => [
            ...prevQuestions,
            { questionText: '', options: ['', '', '', ''], correctAnswer: '', points: 1 }
        ]);
    };

    // Mettre à jour un champ spécifique d'une question
    const handleChangeQuestion = (index: number, field: keyof Question, value: string | number) => {
        setQuestions(prevQuestions => {
            const updated = [...prevQuestions];
            updated[index] = { ...updated[index], [field]: value };  // Utilisation de l'opérateur spread pour éviter la mutation directe
            return updated;
        });
    };

    // Mettre à jour une option spécifique d'une question
    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        setQuestions(prevQuestions => {
            const updated = [...prevQuestions];
            updated[qIndex].options[oIndex] = value;
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !technology || questions.length === 0) {
            toast.error('Veuillez remplir tous les champs requis');
            return;
        }

        try {
            await axios.post('/api/tests/add', {
                title, level, technology, description, scheduledDate, duration, createdBy: user?.id, questions
            });
            toast.success('Test créé avec succès');
            // Reset form
            setTitle('');
            setTechnology('');
            setDescription('');
            setScheduledDate('');
            setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '', points: 1 }]);
        } catch (err) {
            toast.error('Erreur lors de la création du test');
        }
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <Toaster />
            <h2 className="text-2xl font-bold mb-4">Créer un Test</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" className="w-full p-2 border rounded" />
                <input type="number" value={level} onChange={e => setLevel(Number(e.target.value))} placeholder="Niveau" className="w-full p-2 border rounded" />
                <select value={technology} onChange={e => setTechnology(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">Sélectionnez une technologie</option>
                    {technologies.map(tech => (
                        <option key={tech._id} value={tech._id}>{tech.name}</option>
                    ))}
                </select>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full p-2 border rounded" />
                <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full p-2 border rounded" />
                <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} placeholder="Durée (minutes)" className="w-full p-2 border rounded" />

                <h3 className="font-semibold">Questions</h3>
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="border p-3 rounded mb-3">
                        <input
                            value={q.questionText}
                            onChange={e => handleChangeQuestion(qIdx, 'questionText', e.target.value)}
                            placeholder="Texte de la question"
                            className="w-full mb-2 p-2 border rounded"
                        />
                        {q.options.map((opt, oIdx) => (
                            <input
                                key={oIdx}
                                value={opt}
                                onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${oIdx + 1}`}
                                className="w-full mb-1 p-2 border rounded"
                            />
                        ))}
                        <input
                            value={q.correctAnswer}
                            onChange={e => handleChangeQuestion(qIdx, 'correctAnswer', e.target.value)}
                            placeholder="Bonne réponse"
                            className="w-full mb-2 p-2 border rounded"
                        />
                        <input
                            type="number"
                            value={q.points}
                            onChange={e => handleChangeQuestion(qIdx, 'points', Number(e.target.value))}
                            placeholder="Points"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                ))}
                <button type="button" onClick={handleAddQuestion} className="bg-gray-200 px-4 py-2 rounded">+ Ajouter une question</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Créer le test</button>
            </form>
        </div>
    );
};

export default AddTestForm;
