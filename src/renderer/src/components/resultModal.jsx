import React, { useRef, useState, useEffect } from "react";
import { Check, Download, Eye, EyeOff, X, BarChart, Award, ChevronDown, ChevronUp, Clock, Calendar, Printer } from "lucide-react";
import html2pdf from 'html2pdf.js';

const ResultModal = ({ isOpen, onClose, result }) => {
    const contentRef = useRef(null);
    const [showQuestions, setShowQuestions] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [showStats, setShowStats] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    
    // Animation effects
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setAnimateIn(true), 50);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);
    
    if (!isOpen || !result) return null;
    
    const handleExportPDF = () => {
        if (contentRef.current) {
            const dialogElement = contentRef.current;
            const opt = {
                margin: 0.5,
                filename: `${result.username}_RESULT.pdf`,
                image: { type: 'jpeg', quality: 100 },
                html2canvas: { 
                    scale: 10,
                    width: dialogElement.offsetWidth,
                    height: dialogElement.offsetHeight,
                    useCORS: true,
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
    
            html2pdf().set(opt).from(dialogElement).save();
        }
    };
    
    const toggleQuestions = () => {
        setShowQuestions(prev => !prev);
    };
    
    const calculateOverallScore = () => {
        let correctTotal = 0;
        let questionsTotal = 0;
        
        Object.values(result.subjectScores).forEach(score => {
            correctTotal += score.correct;
            questionsTotal += score.total;
        });
        
        return {
            correct: correctTotal,
            total: questionsTotal,
            percentage: Math.round((correctTotal / questionsTotal) * 100)
        };
    };
    
    const overallScore = calculateOverallScore();
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Performance grade calculation
    const getGrade = (percentage) => {
        if (percentage >= 90) return { grade: 'A', description: 'Excellent' };
        if (percentage >= 80) return { grade: 'B', description: 'Very Good' };
        if (percentage >= 70) return { grade: 'C', description: 'Good' };
        if (percentage >= 60) return { grade: 'D', description: 'Satisfactory' };
        return { grade: 'F', description: 'Needs Improvement' };
    };
    
    const performanceGrade = getGrade(overallScore.percentage);
    
    // Get subject performance for charts
    const subjectPerformance = Object.entries(result.subjectScores).map(([subject, score]) => ({
        subject,
        percentage: Math.round((score.correct / score.total) * 100)
    }));
    
    const handlePrint = () => {
        window.print();
    };
    
    const handleClose = () => {
        setAnimateIn(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };
    
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
            <div 
                className={`w-full max-w-4xl text-[10px] bg-white dark:bg-gray-900 rounded-t-md shadow-xl overflow-hidden transition-all duration-500 transform ${animateIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-1 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <h2 className=" font-semibold flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Detailed Assessment Result
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleExportPDF} 
                            className="flex items-center px-3 py-[2px] text-[10px] font-medium bg-white dark:bg-gray-900 text-blue-600 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            title="Export as PDF"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="flex items-center px-3 py-[2px] text-[10px] font-medium bg-white dark:bg-gray-900 text-blue-600 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            title="Print result"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </button>
                        <button 
                            onClick={handleClose} 
                            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white dark:bg-gray-900/10 transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-gray-50 px-6 border-b">
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setActiveTab('summary')}
                            className={`px-4 py-3 font-medium text-[10px] border-b-2 transition-colors ${
                                activeTab === 'summary' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:border-gray-700'
                            }`}
                        >
                            Summary
                        </button>
                        <button 
                            onClick={() => setActiveTab('questions')}
                            className={`px-4 py-3 font-medium text-[10px] border-b-2 transition-colors ${
                                activeTab === 'questions' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:border-gray-700'
                            }`}
                        >
                            Questions & Answers
                        </button>
                        <button 
                            onClick={() => setActiveTab('performance')}
                            className={`px-4 py-3 font-medium text-[10px] border-b-2 transition-colors ${
                                activeTab === 'performance' 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:border-gray-700'
                            }`}
                        >
                            Performance Analysis
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                        <div className="animate-fadeIn">
                            {/* Student Info Card */}
                            <div ref={contentRef} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 overflow-hidden">
                                <div className="p-6 bg-gradient-to-br from-blue-50 via-blue-50 to-white">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold text-gray-800">{result.username}</h3>
                                            <p className="text-gray-600 uppercase flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" /> {currentDate}
                                            </p>
                                            <p className="text-gray-600 uppercase flex items-center">
                                                <Clock className="w-4 h-4 mr-1" /> Class: {result.classname}
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg transform hover:scale-105 transition-transform duration-300">
                                                <img
                                                    src={result.img}
                                                    className="w-full h-full object-cover"
                                                    alt="Student profile"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "/default-profile.png";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Overall Score Card */}
                                <div className="p-6 border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance</h3>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-5xl font-bold text-blue-600">
                                                        {overallScore.percentage}%
                                                    </span>
                                                    <span className="text-gray-500 mt-1">
                                                        {overallScore.correct} of {overallScore.total} correct
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-8 border-gray-100">
                                                    <span className="text-3xl font-bold text-gray-700">{performanceGrade.grade}</span>
                                                    <span className="text-xs text-gray-500">{performanceGrade.description}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div 
                                            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-md transition-shadow"
                                            onClick={() => setShowStats(!showStats)}
                                        >
                                            <div className="flex justify-between items-center cursor-pointer">
                                                <h3 className="text-lg font-semibold">Quick Statistics</h3>
                                                {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                            
                                            <div className={`mt-4 space-y-3 overflow-hidden transition-all duration-500 ${showStats ? 'max-h-60' : 'max-h-0'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span>Highest Subject</span>
                                                    <span className="font-semibold">
                                                        {subjectPerformance.reduce((prev, current) => 
                                                            (prev.percentage > current.percentage) ? prev : current, subjectPerformance[0]).subject}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Lowest Subject</span>
                                                    <span className="font-semibold">
                                                        {subjectPerformance.reduce((prev, current) => 
                                                            (prev.percentage < current.percentage) ? prev : current, subjectPerformance[0]).subject}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Total Questions</span>
                                                    <span className="font-semibold">{overallScore.total}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Time Taken</span>
                                                    <span className="font-semibold">27 min</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Scores */}
                                <div className="p-6 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    {Object.keys(result.subjectScores).map((subject) => (
                                                        <th key={subject} className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            {subject}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {Object.entries(result.subjectScores).map(([subject, score]) => {
                                                        const percentage = (score.correct / score.total) * 100;
                                                        let textColor = "text-yellow-600";
                                                        let bgColor = "bg-yellow-100";
                                                        
                                                        if (percentage >= 80) {
                                                            textColor = "text-blue-600";
                                                            bgColor = "bg-blue-100";
                                                        } else if (percentage >= 60) {
                                                            textColor = "text-blue-600";
                                                            bgColor = "bg-blue-100";
                                                        } else if (percentage < 50) {
                                                            textColor = "text-red-600";
                                                            bgColor = "bg-red-100";
                                                        }
                                                        
                                                        return (
                                                            <td key={subject} className="py-4 px-4 border-t border-gray-200">
                                                                <div className="flex flex-col">
                                                                    <span className={`text-lg font-bold ${textColor}`}>
                                                                        {score.correct}/{score.total}
                                                                    </span>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                                                        <div 
                                                                            className={`${bgColor} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 mt-1">
                                                                        {percentage.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions Tab */}
                    {activeTab === 'questions' && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                                Questions & Answers
                            </h3>
                            
                            <div className="space-y-4">
                                {result.questions.map((question, index) => {
                                    // Calculate if user answered correctly
                                    const userOptionText = question.options[question.userOption] || "Not answered";
                                    const isCorrect = userOptionText === question.correct_answer;
                                    
                                    return (
                                        <div 
                                            key={question.id} 
                                            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-4 border-b bg-gray-50 flex items-start justify-between">
                                                <h4 className="font-medium text-gray-800 flex items-start">
                                                    <span className="inline-flex items-center justify-center min-w-6 h-6 mr-2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                                                        {index + 1}
                                                    </span>
                                                    <span>{question.question}</span>
                                                </h4>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                                    {question.subject}
                                                </span>
                                            </div>
                                            
                                            <div className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        {/* User's answer highlight */}
                                                        <div className={`mb-4 p-3 rounded-md border ${
                                                            isCorrect 
                                                                ? 'bg-blue-50 border-blue-200' 
                                                                : 'bg-red-50 border-red-200'
                                                        }`}>
                                                            <div className="text-[10px] text-gray-500 mb-1">Your answer:</div>
                                                            <div className={`font-medium ${
                                                                isCorrect ? 'text-blue-700' : 'text-red-700'
                                                            }`}>
                                                                {userOptionText}
                                                                {isCorrect ? (
                                                                    <span className="inline-flex items-center ml-2 text-blue-600">
                                                                        <Check className="h-4 w-4" /> Correct
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center ml-2 text-red-600">
                                                                        <X className="h-4 w-4" /> Incorrect
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!isCorrect && (
                                                                <div className="text-[10px] mt-2 text-gray-600">
                                                                    <span className="font-medium">Correct answer: </span> 
                                                                    <span className="text-blue-700">{question.correct_answer}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <ul className="space-y-2">
                                                            {question.options.map((option, idx) => {
                                                                const isCorrect = option === question.correct_answer;
                                                                const isUserSelection = idx === question.userOption;
                                                                
                                                                let optionClass = "flex items-center p-3 rounded-md transition-colors ";
                                                                
                                                                if (isUserSelection && isCorrect) {
                                                                    optionClass += "bg-blue-50 text-blue-700 border border-blue-200";
                                                                } else if (isUserSelection && !isCorrect) {
                                                                    optionClass += "bg-red-50 text-red-700 border border-red-200";
                                                                } else if (isCorrect) {
                                                                    optionClass += "bg-blue-50 text-blue-700 border border-blue-200";
                                                                } else {
                                                                    optionClass += "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100";
                                                                }
                                                                
                                                                return (
                                                                    <li 
                                                                        key={idx} 
                                                                        className={optionClass}
                                                                    >
                                                                        <div className={`inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full ${
                                                                            isUserSelection 
                                                                                ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                                                                : 'bg-white dark:bg-gray-900 border text-gray-600'
                                                                        }`}>
                                                                            {String.fromCharCode(65 + idx)}
                                                                        </div>
                                                                        <span className="flex-1">{option}</span>
                                                                        {isCorrect && (
                                                                            <span className="ml-2">
                                                                                <div className="flex items-center p-1 rounded-full bg-blue-500 text-white h-5 w-5">
                                                                                    <Check className="h-3 w-3" />
                                                                                </div>
                                                                            </span>
                                                                        )}
                                                                        {isUserSelection && !isCorrect && (
                                                                            <span className="ml-2">                                      
                                                                                <div className="flex items-center p-1 rounded-full bg-red-500 text-white h-5 w-5">
                                                                                    <X className="h-3 w-3" />
                                                                                </div>
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                    
                                                    {question.img ? (
                                                        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                            <img 
                                                                src={question.img}  
                                                                className="max-h-48 object-contain hover:scale-105 transition-transform"
                                                                alt="Question illustration"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="hidden md:flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-400">
                                                            No image for this question
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Performance Analysis Tab */}
                    {activeTab === 'performance' && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                                Performance Analysis
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Visualization of subject performance */}
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <h4 className="text-[10px] font-medium text-gray-600 uppercase mb-4">Subject Performance</h4>
                                    
                                    <div className="space-y-4">
                                        {subjectPerformance.map(item => (
                                            <div key={item.subject}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[10px] font-medium text-gray-700">{item.subject}</span>
                                                    <span className="text-[10px] font-medium text-gray-700">{item.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div 
                                                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                                            item.percentage >= 80 ? 'bg-blue-500' : 
                                                            item.percentage >= 60 ? 'bg-blue-500' : 
                                                            item.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`} 
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Performance Recommendations */}
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <h4 className="text-[10px] font-medium text-gray-600 uppercase mb-4">Improvement Areas</h4>
                                    
                                    <div className="space-y-4">
                                        {subjectPerformance
                                            .filter(item => item.percentage < 70)
                                            .map(item => (
                                                <div key={item.subject} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                                    <h5 className="font-medium text-amber-800 mb-1">{item.subject}</h5>
                                                    <p className="text-[10px] text-amber-700">
                                                        Consider focusing on improving your knowledge in {item.subject}. 
                                                        Your current score is {item.percentage}%, which could be enhanced 
                                                        with additional study.
                                                    </p>
                                                </div>
                                            ))}
                                        
                                        {subjectPerformance.filter(item => item.percentage < 70).length === 0 && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <h5 className="font-medium text-blue-800 mb-1">Great work!</h5>
                                                <p className="text-[10px] text-blue-700">
                                                    You're performing well across all subjects. Keep up the good work and 
                                                    consider challenging yourself with more advanced topics.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Detailed Statistics */}
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow col-span-1 md:col-span-2">
                                    <h4 className="text-[10px] font-medium text-gray-600 uppercase mb-4">Performance Metrics</h4>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <div className="text-3xl font-bold text-blue-600">{overallScore.percentage}%</div>
                                            <div className="text-[10px] text-gray-500">Overall Score</div>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <div className="text-3xl font-bold text-blue-600">{overallScore.correct}</div>
                                            <div className="text-[10px] text-gray-500">Total Correct</div>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <div className="text-3xl font-bold text-red-600">{overallScore.total - overallScore.correct}</div>
                                            <div className="text-[10px] text-gray-500">Total Incorrect</div>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <div className="text-3xl font-bold text-blue-600">{performanceGrade.grade}</div>
                                            <div className="text-[10px] text-gray-500">Grade</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Footer */}
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleClose} 
                            className="px-4 py-2 text-[10px] font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Add a print-specific style to hide buttons and show full content when printing */}
            <style jsx>{`
                @media print {
                    button, .no-print {
                        display: none !important;
                    }
                    .max-h-[80vh] {
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .animate-fadeIn {
                        opacity: 1 !important;
                        animation: none !important;
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>

            </div>
    )}
export default ResultModal;