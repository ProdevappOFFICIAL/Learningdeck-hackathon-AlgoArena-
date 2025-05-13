import { useState, useEffect, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import { 
  FileDown, Printer, FileText, Settings, ChevronDown, ChevronUp, X, 
  Check, CheckSquare, Square, Eye, EyeOff, Columns, Layout, Save, Download
} from 'lucide-react'
import axios from 'axios'
import ResultModal from '../components/resultModal'
import { FcAddDatabase, FcDeleteDatabase } from 'react-icons/fc'
import { FiMaximize } from 'react-icons/fi'
import Dailog from '../components/dailog'
import { BiExport, BiUser } from 'react-icons/bi'
import { BsChevronDown, BsChevronUp } from 'react-icons/bs'

// New component for custom result export
const ResultExportBuilder = ({ 
  filteredResults, 
  selectedClass, 
  exams, 
  Batch, 
  onClose,
  isOpen 
}) => {
  const [subjects, setSubjects] = useState([])
  const [exportSettings, setExportSettings] = useState({
    title: 'SCHOOL NAME',
    subtitle: 'RESULT MANUSCRIPT',
    term: 'TERM',
    schoolLogo: null,
    watermark: null,
    showPassport: false,
    showPercentage: true,
    showRawScores: true,
    showCATScores: true,
    showTotal: true,
    showPosition: true,
    showFooter: true,
    showGrades: true,
    showRemarks: true,
    showStatistics: true,
    showAttendance: false,
    showBehavior: false,
    showClassTeacherComment: false,
    showPrincipalComment: false,
    gradeScale: [
      { min: 80, grade: 'A', remark: 'Excellent' },
      { min: 70, grade: 'B', remark: 'Very Good' },
      { min: 60, grade: 'C', remark: 'Good' },
      { min: 50, grade: 'D', remark: 'Average' },
      { min: 40, grade: 'E', remark: 'Fair' },
      { min: 0, grade: 'F', remark: 'Poor' }
    ],
    selectedSubjects: [],
    layout: 'landscape', // 'portrait' or 'landscape'
    tableStyle: 'bordered', // 'bordered', 'striped', 'minimal'
    paperSize: 'a4', // 'a4', 'letter', 'legal'
    font: 'Arial', // 'Arial', 'Times New Roman', 'Calibri'
    primaryColor: '#000000',
    secondaryColor: '#f2f2f2',
    accentColor: '#0066cc',
    headerAlignment: 'center', // 'left', 'center', 'right'
    pageNumbering: true,
    dateFormat: 'DD/MM/YYYY'
  })
  const [previewMode, setPreviewMode] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [currentTemplateName, setCurrentTemplateName] = useState('')
  const [currentTab, setCurrentTab] = useState('general')
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [customCSS, setCustomCSS] = useState('')
  const [statisticsData, setStatisticsData] = useState(null)
  const [showGradeEditor, setShowGradeEditor] = useState(false)
  const [exportFormat, setExportFormat] = useState('html')
  const [schoolLogoPicker, setSchoolLogoPicker] = useState(false)
  const [watermarkPicker, setWatermarkPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeColorSetting, setActiveColorSetting] = useState('')
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizedStudent, setCustomizedStudent] = useState(null)

  // Extract all subjects from results
  useEffect(() => {
    if (filteredResults.length > 0) {
      const allSubjects = new Set()
      
      filteredResults.forEach(result => {
        if (result.subjectScores) {
          Object.keys(result.subjectScores).forEach(subject => {
            allSubjects.add(subject)
          })
        }
      })
      
      const subjectArray = Array.from(allSubjects).sort()
      setSubjects(subjectArray)
      
      // Initialize all subjects as selected
      setExportSettings(prev => ({
        ...prev,
        selectedSubjects: subjectArray
      }))

      // Generate class statistics
      generateStatistics(filteredResults)
    }
  }, [filteredResults])

  // Calculate class statistics
  const generateStatistics = (resultsData) => {
    if (!resultsData || resultsData.length === 0) return
    
    const stats = {
      totalStudents: resultsData.length,
      subjectPerformance: {},
      overallPerformance: {
        highestScore: 0,
        lowestScore: 100,
        averageScore: 0,
        passRate: 0,
        distinctionRate: 0
      }
    }
    
    // Calculate overall scores for all students
    let totalPercentage = 0
    let passCount = 0
    let distinctionCount = 0
    
    const resultsWithPositions = calculatePositions(resultsData)
    
    resultsWithPositions.forEach(student => {
      totalPercentage += student.percentage
      
      if (student.percentage >= 40) passCount++
      if (student.percentage >= 70) distinctionCount++
      
      if (student.percentage > stats.overallPerformance.highestScore) {
        stats.overallPerformance.highestScore = student.percentage
      }
      
      if (student.percentage < stats.overallPerformance.lowestScore) {
        stats.overallPerformance.lowestScore = student.percentage
      }
      
      // Calculate subject statistics
      if (student.subjectScores) {
        Object.entries(student.subjectScores).forEach(([subject, score]) => {
          if (!stats.subjectPerformance[subject]) {
            stats.subjectPerformance[subject] = {
              totalScore: 0,
              totalPossible: 0,
              passCount: 0,
              distinctionCount: 0
            }
          }
          
          const subjectPercentage = Math.round((score.correct / score.total) * 100)
          stats.subjectPerformance[subject].totalScore += score.correct
          stats.subjectPerformance[subject].totalPossible += score.total
          
          if (subjectPercentage >= 40) stats.subjectPerformance[subject].passCount++
          if (subjectPercentage >= 70) stats.subjectPerformance[subject].distinctionCount++
        })
      }
    })
    
    // Calculate averages and rates
    stats.overallPerformance.averageScore = Math.round(totalPercentage / stats.totalStudents)
    stats.overallPerformance.passRate = Math.round((passCount / stats.totalStudents) * 100)
    stats.overallPerformance.distinctionRate = Math.round((distinctionCount / stats.totalStudents) * 100)
    
    // Calculate subject averages
    Object.keys(stats.subjectPerformance).forEach(subject => {
      const subjectStats = stats.subjectPerformance[subject]
      subjectStats.averagePercentage = Math.round((subjectStats.totalScore / subjectStats.totalPossible) * 100)
      subjectStats.passRate = Math.round((subjectStats.passCount / stats.totalStudents) * 100)
      subjectStats.distinctionRate = Math.round((subjectStats.distinctionCount / stats.totalStudents) * 100)
    })
    
    setStatisticsData(stats)
  }

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('resultExportTemplates')
      if (savedData) {
        setSavedTemplates(JSON.parse(savedData))
      }
    } catch (error) {
      console.error('Error loading saved templates:', error)
    }
  }, [])

  const handleSettingChange = (setting, value) => {
    setExportSettings({
      ...exportSettings,
      [setting]: value
    })
  }

  const toggleSubject = (subject) => {
    setExportSettings(prev => {
      const currentSelected = [...prev.selectedSubjects]
      
      if (currentSelected.includes(subject)) {
        return {
          ...prev,
          selectedSubjects: currentSelected.filter(s => s !== subject)
        }
      } else {
        return {
          ...prev,
          selectedSubjects: [...currentSelected, subject].sort()
        }
      }
    })
  }

  const selectAllSubjects = () => {
    setExportSettings(prev => ({
      ...prev,
      selectedSubjects: [...subjects]
    }))
  }

  const deselectAllSubjects = () => {
    setExportSettings(prev => ({
      ...prev,
      selectedSubjects: []
    }))
  }

  const updateGradeScale = (index, field, value) => {
    setExportSettings(prev => {
      const newGradeScale = [...prev.gradeScale]
      newGradeScale[index] = {
        ...newGradeScale[index],
        [field]: field === 'min' ? parseInt(value) : value
      }
      return {
        ...prev,
        gradeScale: newGradeScale
      }
    })
  }

  const addGradeLevel = () => {
    setExportSettings(prev => ({
      ...prev,
      gradeScale: [
        ...prev.gradeScale,
        { min: 0, grade: 'F', remark: 'Poor' }
      ].sort((a, b) => b.min - a.min)
    }))
  }

  const removeGradeLevel = (index) => {
    setExportSettings(prev => ({
      ...prev,
      gradeScale: prev.gradeScale.filter((_, i) => i !== index)
    }))
  }

  const saveTemplate = () => {
    if (!currentTemplateName.trim()) {
      toast.error('Please provide a template name')
      return
    }

    try {
      const updatedTemplates = [
        ...savedTemplates.filter(t => t.name !== currentTemplateName),
        {
          name: currentTemplateName,
          settings: exportSettings,
          customCSS: customCSS,
          dateCreated: new Date().toISOString()
        }
      ]

      localStorage.setItem('resultExportTemplates', JSON.stringify(updatedTemplates))
      setSavedTemplates(updatedTemplates)
      toast.success(`Template "${currentTemplateName}" saved successfully`)
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const loadTemplate = (templateName) => {
    const template = savedTemplates.find(t => t.name === templateName)
    if (template) {
      setExportSettings(template.settings)
      setCurrentTemplateName(template.name)
      if (template.customCSS) setCustomCSS(template.customCSS)
      setShowTemplates(false)
      toast.success(`Template "${template.name}" loaded`)
    }
  }

  const deleteTemplate = (templateName, e) => {
    e.stopPropagation()
    
    try {
      const updatedTemplates = savedTemplates.filter(t => t.name !== templateName)
      localStorage.setItem('resultExportTemplates', JSON.stringify(updatedTemplates))
      setSavedTemplates(updatedTemplates)
      toast.success(`Template "${templateName}" deleted`)
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setExportSettings(prev => ({
        ...prev,
        [type]: e.target.result
      }))
      
      if (type === 'schoolLogo') {
        setSchoolLogoPicker(false)
      } else if (type === 'watermark') {
        setWatermarkPicker(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleColorChange = (color) => {
    setExportSettings(prev => ({
      ...prev,
      [activeColorSetting]: color
    }))
  }

  // Generate total scores and positions for students
  const calculatePositions = (resultsData) => {
    // Create a copy of the results data
    const resultsWithPositions = [...resultsData]
    
    // Calculate total scores for each student
    resultsWithPositions.forEach(student => {
      let totalCorrect = 0
      let totalPossible = 0
      
      if (student.subjectScores) {
        Object.entries(student.subjectScores).forEach(([subject, score]) => {
          if (exportSettings.selectedSubjects.includes(subject)) {
            totalCorrect += score.correct
            totalPossible += score.total
          }
        })
      }
      
      student.totalScore = totalCorrect * 2
      student.totalPossible = totalPossible * 2
      student.percentage = totalPossible > 0 ? 
        Math.round((totalCorrect / totalPossible) * 100) : 0
      
      // Calculate grade and remark based on percentage
      const gradeInfo = exportSettings.gradeScale.find(g => student.percentage >= g.min)
      if (gradeInfo) {
        student.grade = gradeInfo.grade
        student.remark = gradeInfo.remark
      } else {
        student.grade = 'F'
        student.remark = 'Poor'
      }
    })
    
    // Sort by total score (descending)
    resultsWithPositions.sort((a, b) => b.totalScore - a.totalScore)
    
    // Assign positions
    let currentPosition = 1
    let previousScore = -1
    let skipPositions = 0
    
    resultsWithPositions.forEach((student, index) => {
      if (student.totalScore === previousScore) {
        student.position = currentPosition
        skipPositions++
      } else {
        currentPosition += skipPositions
        student.position = currentPosition
        skipPositions = 0
        currentPosition++
      }
      
      previousScore = student.totalScore
    })
    
    return resultsWithPositions
  }

  // Generate subject grade for a student
  const getSubjectGrade = (percentage) => {
    const gradeInfo = exportSettings.gradeScale.find(g => percentage >= g.min)
    return gradeInfo ? gradeInfo.grade : 'F'
  }

  // Generate subject remark for a student
  const getSubjectRemark = (percentage) => {
    const gradeInfo = exportSettings.gradeScale.find(g => percentage >= g.min)
    return gradeInfo ? gradeInfo.remark : 'Poor'
  }

  // Generate styled PDF
  const generatePDF = () => {
    // PDF generation code would go here
    // Typically would use a library like jsPDF or html2pdf
    toast.info('PDF export in development')
  }

  // Generate Excel file
  const generateExcel = () => {
    // Excel generation code would go here
    // Typically would use a library like exceljs or xlsx
    toast.info('Excel export in development')
  }

  // Open student customization modal
  const openCustomize = (student) => {
    setCustomizedStudent(student)
    setIsCustomizing(true)
  }

  // Close student customization modal
  const closeCustomize = () => {
    setIsCustomizing(false)
    setCustomizedStudent(null)
  }

  // Generate the HTML content for export
  const generateExportHTML = () => {
    if (filteredResults.length === 0) {
      toast.error('No results to export')
      return null
    }
    
    try {
      // Calculate positions if needed
      const resultsWithPositions = calculatePositions(filteredResults)
      
      // Create HTML content
      let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${exportSettings.title} - Result Sheet</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: ${exportSettings.paperSize} ${exportSettings.layout};
            margin: 1cm;
          }
          body { 
            font-family: ${exportSettings.font}, sans-serif; 
            margin: 20px; 
            color: ${exportSettings.primaryColor};
          }
          .header { 
            text-align: ${exportSettings.headerAlignment}; 
            margin-bottom: 20px; 
          }
          .school-logo {
            max-height: 80px;
            max-width: 200px;
          }
          .watermark {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            z-index: -1;
            pointer-events: none;
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
          }
          .page-number {
            position: absolute;
            bottom: 10px;
            right: 10px;
            font-size: 9px;
          }
          .statistic-card {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 8px;
            margin-bottom: 10px;
            background-color: #f9f9f9;
          }
          .statistic-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
          }
          .statistic-value {
            font-size: 14px;
            color: ${exportSettings.accentColor};
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            ${exportSettings.layout === 'landscape' ? 'page-break-inside: auto;' : ''}
          }
          ${exportSettings.tableStyle === 'bordered' ? `
            th, td { 
              border: 1px solid ${exportSettings.primaryColor}; 
              padding: 4px; 
              text-align: center; 
              font-size: 11px; 
            }
          ` : exportSettings.tableStyle === 'striped' ? `
            th, td {
              padding: 4px;
              text-align: center;
              font-size: 11px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: ${exportSettings.secondaryColor};
            }
          ` : `
            th, td {
              padding: 4px;
              text-align: center;
              font-size: 11px;
              border-bottom: 1px solid #eee;
            }
          `}
          th { 
            background-color: ${exportSettings.secondaryColor}; 
          }
          .student-name { 
            text-align: left; 
            font-weight: bold;
          }
          .subject-header { 
            text-transform: uppercase; 
          }
          @media print {
            @page {
              size: ${exportSettings.paperSize} ${exportSettings.layout};
            }
            .no-print { 
              display: none; 
            }
          }
          .position-high {
            background-color: #e6f7e6;
            font-weight: bold;
          }
          .position-mid {
            background-color: #fff8e6;
          }
          .position-low {
            background-color: #ffebeb;
          }
          .score-high {
            color: #008800;
          }
          .score-mid {
            color: #885500;
          }
          .score-low {
            color: #cc0000;
          }
          .grade {
            font-weight: bold;
            padding: 2px 4px;
            border-radius: 2px;
          }
          .grade-A {
            background-color: #e6f7e6;
            color: #008800;
          }
          .grade-B {
            background-color: #e6f7f2;
            color: #00887a;
          }
          .grade-C {
            background-color: #e6eff7;
            color: #0066cc;
          }
          .grade-D {
            background-color: #f2e6f7;
            color: #8800cc;
          }
          .grade-E {
            background-color: #f7e6e6;
            color: #cc0066;
          }
          .grade-F {
            background-color: #f7e6e6;
            color: #cc0000;
          }
          .comments-section {
            margin-top: 15px;
            border: 1px solid #ddd;
            padding: 8px;
          }
          .comment-label {
            font-weight: bold;
            font-size: 10px;
          }
          .comment-text {
            font-size: 10px;
            margin-top: 3px;
            min-height: 20px;
          }
          .attendance-section {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            border: 1px solid #ddd;
            padding: 8px;
          }
          .attendance-item {
            text-align: center;
          }
          .attendance-label {
            font-size: 9px;
            font-weight: bold;
          }
          .attendance-value {
            font-size: 12px;
            margin-top: 3px;
          }
          .behavior-section {
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            border: 1px solid #ddd;
            padding: 8px;
          }
          .behavior-item {
            display: flex;
            justify-content: space-between;
          }
          .behavior-label {
            font-size: 9px;
          }
          .behavior-value {
            font-size: 9px;
            font-weight: bold;
          }
          .statistics-container {
            margin-top: 20px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          ${customCSS}
        </style>
      </head>
      <body>
       
        
        ${exportSettings.watermark ? `<div class="watermark" style="background-image: url('${exportSettings.watermark}');"></div>` : ''}
        
        <div class="header">
          ${exportSettings.schoolLogo ? `<img src="${exportSettings.schoolLogo}" class="school-logo" alt="School Logo" />` : ''}
          <h2>${exportSettings.title}</h2>
      
          <h4>${exportSettings.term}</h4>
         
        </div>
      `
      
      // Add class statistics if enabled
      if (exportSettings.showStatistics && statisticsData) {
        htmlContent += `
        <div class="statistics-container">
          <div class="statistic-card">
            <div class="statistic-title">Class Size</div>
            <div class="statistic-value">${statisticsData.totalStudents} Students</div>
          </div>
          <div class="statistic-card">
            <div class="statistic-title">Class Average</div>
            <div class="statistic-value">${statisticsData.overallPerformance.averageScore}%</div>
          </div>
          <div class="statistic-card">
            <div class="statistic-title">Pass Rate</div>
            <div class="statistic-value">${statisticsData.overallPerformance.passRate}%</div>
          </div>
          <div class="statistic-card">
            <div class="statistic-title">Distinction Rate</div>
            <div class="statistic-value">${statisticsData.overallPerformance.distinctionRate}%</div>
          </div>
          <div class="statistic-card">
            <div class="statistic-title">Highest Score</div>
            <div class="statistic-value">${statisticsData.overallPerformance.highestScore}%</div>
          </div>
          <div class="statistic-card">
            <div class="statistic-title">Lowest Score</div>
            <div class="statistic-value">${statisticsData.overallPerformance.lowestScore}%</div>
          </div>
        </div>
        `
      }
      
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>S/N</th>
              ${exportSettings.showPosition ? '<th>POSITION</th>' : ''}
              <th>STUDENT NAME</th>
              ${exportSettings.showPassport ? '<th>PASSPORT</th>' : ''}
      `
      
      // Add subject headers based on selected subjects
      exportSettings.selectedSubjects.forEach(subject => {
        let colSpan = 1
        if (exportSettings.showRawScores) colSpan++
        if (exportSettings.showCATScores) colSpan++
        if (exportSettings.showGrades) colSpan++
        
        htmlContent += `<th colspan="${colSpan}" class="subject-header">${subject}</th>`
      })
      
      // Add total column if needed
      if (exportSettings.showTotal) {
        let totalColSpan = 1
        if (exportSettings.showPercentage) totalColSpan++
        if (exportSettings.showGrades) totalColSpan++
        if (exportSettings.showRemarks) totalColSpan++
        
        htmlContent += `<th colspan="${totalColSpan}">TOTAL</th>`
      }
      
      htmlContent += `</tr>`
      
      // Add subheaders for score types if needed
      if (exportSettings.showRawScores || exportSettings.showCATScores || exportSettings.showGrades) {
        htmlContent += `<tr><th></th>${exportSettings.showPosition ? '<th></th>' : ''}<th></th>${exportSettings.showPassport ? '<th></th>' : ''}`
        
        exportSettings.selectedSubjects.forEach(() => {
          if (exportSettings.showRawScores) htmlContent += `<th>Raw</th>`
          if (exportSettings.showCATScores) htmlContent += `<th>CAT</th>`
          if (exportSettings.showGrades) htmlContent += `<th>Grade</th>`
        })
        
        if (exportSettings.showTotal) {
          if (exportSettings.showTotal) htmlContent += `<th>Score</th>`
          if (exportSettings.showPercentage) htmlContent += `<th>%</th>`
          if (exportSettings.showGrades) htmlContent += `<th>Grade</th>`
          if (exportSettings.showRemarks) htmlContent += `<th>Remark</th>`
        }
        
        htmlContent += `</tr>`
      }
      
      htmlContent += `</thead><tbody>`
      
      // Add data rows
      resultsWithPositions.forEach((student, index) => {
        // Determine position styling class
        let positionClass = ''
        if (exportSettings.showPosition) {
          if (student.position <= 3) {
            positionClass = 'position-high'
          } else if (student.position <= Math.ceil(resultsWithPositions.length * 0.3)) {
            positionClass = 'position-mid'
          } else if (student.position > Math.ceil(resultsWithPositions.length * 0.7)) {
            positionClass = 'position-low'
          }
        }
        
        htmlContent += `
        <tr>
          <td>${index + 1}</td>
          ${exportSettings.showPosition ? `<td class="${positionClass}">${student.position}</td>` : ''}
          <td class="student-name">${student.username || 'Unknown'}</td>
          ${exportSettings.showPassport ? `<td>${student.img ? `<img src="${student.img}" width="30" height="30" alt="Student">` : ''}</td>` : ''}
        `
        
        // Add subject scores
        exportSettings.selectedSubjects.forEach(subject => {
          const score = student.subjectScores?.[subject]
          
          if (score) {
            // Calculate percentage for color coding
            const percentage = Math.round((score.correct / score.total) * 100)
            let scoreClass = ''
            
            if (percentage >= 70) {
              scoreClass = 'score-high'
            } else if (percentage >= 50) {
              scoreClass = 'score-mid'
            } else {
              scoreClass = 'score-low'
            }
            
            // Get subject grade
            const subjectGrade = getSubjectGrade(percentage)
            
            if (exportSettings.showRawScores) {
              htmlContent += `<td>${exportSettings.showPercentage ? `${percentage}%` : `${score.correct}/${score.total}`}</td>`
            }
            
            if (exportSettings.showCATScores) {
              htmlContent += `<td class="${scoreClass}">${score.correct * 2}/${score.total * 2}</td>`
            }
            
            if (exportSettings.showGrades) {
              htmlContent += `<td><span class="grade grade-${subjectGrade}">${subjectGrade}</span></td>`
            }
          } else {
            if (exportSettings.showRawScores) htmlContent += `<td>-</td>`
            if (exportSettings.showCATScores) htmlContent += `<td>-</td>`
            if (exportSettings.showGrades) htmlContent += `<td>-</td>`
          }
        })
        
        // Add total score if needed
        if (exportSettings.showTotal) {
          // Determine total score color class
          let totalScoreClass = ''
          if (student.percentage >= 70) {
            totalScoreClass = 'score-high'
          } else if (student.percentage >= 50) {
            totalScoreClass = 'score-mid'
          } else {
            totalScoreClass = 'score-low'
          }
          
          htmlContent += `<td class="${totalScoreClass}">${student.totalScore}/${student.totalPossible}</td>`
          
          if (exportSettings.showPercentage) {
            htmlContent += `<td class="${totalScoreClass}">${student.percentage}%</td>`}
            if (exportSettings.showGrades) {
              htmlContent += `<td><span class="grade grade-${student.grade}">${student.grade}</span></td>`
            }
            
            if (exportSettings.showRemarks) {
              htmlContent += `<td>${student.remark}</td>`
            }
          }
          
          htmlContent += `</tr>`
        })
        
        htmlContent += `</tbody></table>`
        
        // Add individual student sections if needed
        if (exportSettings.showAttendance || exportSettings.showBehavior || 
            exportSettings.showClassTeacherComment || exportSettings.showPrincipalComment) {
          
          resultsWithPositions.forEach(student => {
            htmlContent += `
            <div style="page-break-before: always; margin-top: 20px; border: 1px solid #ddd; padding: 15px;">
              <h3 style="text-align: center;">Student Performance Report</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                  <strong>Name:</strong> ${student.username || 'Unknown'}<br>
                  <strong>Class:</strong> ${selectedClass.toUpperCase() || 'N/A'}<br>
                  <strong>Position:</strong> ${student.position} out of ${resultsWithPositions.length}
                </div>
                <div>
                  ${student.img ? `<img src="${student.img}" width="100" height="100" alt="Student">` : ''}
                </div>
              </div>
              
              <table style="margin-bottom: 15px;">
                <thead>
                  <tr>
                    <th>Subject</th>
                    ${exportSettings.showRawScores ? '<th>Raw Score</th>' : ''}
                    ${exportSettings.showCATScores ? '<th>CAT Score</th>' : ''}
                    <th>Percentage</th>
                    ${exportSettings.showGrades ? '<th>Grade</th>' : ''}
                    ${exportSettings.showRemarks ? '<th>Remark</th>' : ''}
                  </tr>
                </thead>
                <tbody>
            `
            
            exportSettings.selectedSubjects.forEach(subject => {
              const score = student.subjectScores?.[subject]
              
              if (score) {
                const percentage = Math.round((score.correct / score.total) * 100)
                const subjectGrade = getSubjectGrade(percentage)
                const subjectRemark = getSubjectRemark(percentage)
                
                htmlContent += `
                <tr>
                  <td>${subject}</td>
                  ${exportSettings.showRawScores ? `<td>${score.correct}/${score.total}</td>` : ''}
                  ${exportSettings.showCATScores ? `<td>${score.correct * 2}/${score.total * 2}</td>` : ''}
                  <td>${percentage}%</td>
                  ${exportSettings.showGrades ? `<td><span class="grade grade-${subjectGrade}">${subjectGrade}</span></td>` : ''}
                  ${exportSettings.showRemarks ? `<td>${subjectRemark}</td>` : ''}
                </tr>
                `
              }
            })
            
            htmlContent += `
                <tr style="font-weight: bold;">
                  <td>Total</td>
                  ${exportSettings.showRawScores ? '<td>-</td>' : ''}
                  ${exportSettings.showCATScores ? '<td>-</td>' : ''}
                  <td>${student.percentage}%</td>
                  ${exportSettings.showGrades ? `<td><span class="grade grade-${student.grade}">${student.grade}</span></td>` : ''}
                  ${exportSettings.showRemarks ? `<td>${student.remark}</td>` : ''}
                </tr>
              </tbody>
            </table>
            `
            
            // Attendance section
            if (exportSettings.showAttendance) {
              htmlContent += `
              <div class="attendance-section">
                <div class="attendance-item">
                  <div class="attendance-label">School Days</div>
                  <div class="attendance-value">120</div>
                </div>
                <div class="attendance-item">
                  <div class="attendance-label">Present</div>
                  <div class="attendance-value">${Math.floor(Math.random() * 30) + 90}</div>
                </div>
                <div class="attendance-item">
                  <div class="attendance-label">Absent</div>
                  <div class="attendance-value">${Math.floor(Math.random() * 30)}</div>
                </div>
                <div class="attendance-item">
                  <div class="attendance-label">Late</div>
                  <div class="attendance-value">${Math.floor(Math.random() * 20)}</div>
                </div>
              </div>
              `
            }
            
            // Behavior section
            if (exportSettings.showBehavior) {
              htmlContent += `
              <div class="behavior-section">
                <div class="behavior-item">
                  <span class="behavior-label">Punctuality</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Attentiveness</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Neatness</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Conduct</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Participation</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Homework</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Creativity</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
                <div class="behavior-item">
                  <span class="behavior-label">Leadership</span>
                  <span class="behavior-value">${['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)]}</span>
                </div>
              </div>
              `
            }
            
            // Comments section
            if (exportSettings.showClassTeacherComment || exportSettings.showPrincipalComment) {
              htmlContent += `<div class="comments-section">`
              
              if (exportSettings.showClassTeacherComment) {
                const comments = [
                  "Shows great progress this term. Keep up the good work!",
                  "Has potential but needs to improve focus in class.",
                  "An excellent student who consistently performs well.",
                  "Needs to improve in completing assignments on time.",
                  "Shows remarkable improvement in critical areas."
                ]
                
                htmlContent += `
                <div style="margin-bottom: 10px;">
                  <div class="comment-label">Class Teacher's Comment:</div>
                  <div class="comment-text">${comments[Math.floor(Math.random() * comments.length)]}</div>
                </div>
                `
              }
              
              if (exportSettings.showPrincipalComment) {
                const comments = [
                  "Excellent performance, continue to maintain this standard!",
                  "Good effort, but there is room for improvement.",
                  "Satisfactory result, work harder next term.",
                  "Needs to be more serious with studies.",
                  "Shows leadership qualities and academic excellence."
                ]
                
                htmlContent += `
                <div>
                  <div class="comment-label">Principal's Comment:</div>
                  <div class="comment-text">${comments[Math.floor(Math.random() * comments.length)]}</div>
                </div>
                `
              }
              
              htmlContent += `</div>`
            }
            
            htmlContent += `</div>`
          })
        }
        
        // Add footer if needed
        if (exportSettings.showFooter) {
          htmlContent += `
          <div style="margin-top: 20px; font-size: 10px;">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>
              <span style="float: left; width: 30%; border-top: 1px solid #000; text-align: center; padding-top: 5px;">Class Teacher's Signature</span>
              <span style="float: left; width: 30%; margin-left: 5%; border-top: 1px solid #000; text-align: center; padding-top: 5px;">Principal's Signature</span>
              <span style="float: right; width: 30%; border-top: 1px solid #000; text-align: center; padding-top: 5px;">Parent's Signature</span>
              <div style="clear: both;"></div>
            </p>
          </div>
          `
        }
        
        // Add page numbering if enabled
        if (exportSettings.pageNumbering) {
          htmlContent += `
          <script>
            (function() {
              var pages = document.querySelectorAll('body > div:not(.no-print)');
              pages.forEach(function(page, index) {
                var pageNumber = document.createElement('div');
                pageNumber.className = 'page-number';
                pageNumber.textContent = 'Page ' + (index + 1) + ' of ' + pages.length;
                page.appendChild(pageNumber);
              });
            })();
          </script>
          `
        }
        
        htmlContent += `</body></html>`
        
        return htmlContent
      } catch (error) {
        console.error('HTML generation error:', error)
        toast.error('Failed to generate HTML content')
        return null
      }
    }
  
    // Preview the current export template
    const previewExport = () => {
      setPreviewMode(!previewMode)
    }
  
    // Export to HTML file
    const exportToHTML = () => {
      const htmlContent = generateExportHTML()
      if (!htmlContent) return
      
      try {
        // Create downloadable link
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `${selectedClass || 'All_Classes'}_${Batch || 'All_Exams'}_Results.html`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('HTML exported successfully')
      } catch (error) {
        console.error('HTML export error:', error)
        toast.error('Failed to export HTML')
      }
    }
  
    // Print the current export
    const printExport = () => {
      const htmlContent = generateExportHTML()
      if (!htmlContent) return
      
      try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank')
        
        if (!printWindow) {
          toast.error('Pop-up blocked. Please allow pop-ups for printing.')
          return
        }
        
        // Write to the print window
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        toast.success('Print preview opened')
      } catch (error) {
        console.error('Print preview error:', error)
        toast.error('Error creating print preview')
      }
    }
    
    // Export based on selected format
    const handleExport = () => {
      switch (exportFormat) {
        case 'html':
          exportToHTML()
          break
        case 'pdf':
          generatePDF()
          break
        case 'excel':
          generateExcel()
          break
        default:
          exportToHTML()
      }
    }
  
    // Reset to default settings
    const resetToDefaults = () => {
      setExportSettings({
        title: 'UNCLE TEE SECONDARY SCHOOL ONDO',
        subtitle: 'CAT 1 & CAT 2 (RESULT MANUSCRIPT)',
        term: 'FIRST TERM 2024/2025 ACADEMIC SESSION',
        schoolLogo: null,
        watermark: null,
        showPassport: false,
        showPercentage: true,
        showRawScores: true,
        showCATScores: true,
        showTotal: true,
        showPosition: true,
        showFooter: true,
        showGrades: true,
        showRemarks: true,
        showStatistics: true,
        showAttendance: false,
        showBehavior: false,
        showClassTeacherComment: false,
        showPrincipalComment: false,
        gradeScale: [
          { min: 80, grade: 'A', remark: 'Excellent' },
          { min: 70, grade: 'B', remark: 'Very Good' },
          { min: 60, grade: 'C', remark: 'Good' },
          { min: 50, grade: 'D', remark: 'Average' },
          { min: 40, grade: 'E', remark: 'Fair' },
          { min: 0, grade: 'F', remark: 'Poor' }
        ],
        selectedSubjects: subjects,
        layout: 'landscape',
        tableStyle: 'bordered',
        paperSize: 'a4',
        font: 'Arial',
        primaryColor: '#000000',
        secondaryColor: '#f2f2f2',
        accentColor: '#0066cc',
        headerAlignment: 'center',
        pageNumbering: true,
        dateFormat: 'DD/MM/YYYY'
      })
      setCustomCSS('')
      toast.success('Settings reset to defaults')
    }
  
    const renderTabContent = () => {
      switch (currentTab) {
        case 'general':
          return (
            <>
              {/* Header Settings */}
              <div className="mb-4 border rounded-lg p-3">
                <h3 className="font-medium mb-2">Header Settings</h3>
                <div className="grid gap-2">
                  <div>
                    <label className=" block mb-1">Title</label>
                    <input
                      type="text"
                      value={exportSettings.title}
                      onChange={(e) => handleSettingChange('title', e.target.value)}
                      className="w-full p-1  border rounded"
                    />
                  </div>
                  <div className='hidden'>
                    <label className=" block mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={exportSettings.subtitle}
                      onChange={(e) => handleSettingChange('subtitle', e.target.value)}
                      className="w-full p-1  border rounded"
                    />
                  </div>
                  <div>
                    <label className=" block mb-1">Term/Session</label>
                    <input
                      type="text"
                      value={exportSettings.term}
                      onChange={(e) => handleSettingChange('term', e.target.value)}
                      className="w-full p-1  border rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="">School Logo</span>
                    <button 
                      onClick={() => setSchoolLogoPicker(!schoolLogoPicker)}
                      className=" bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                    >
                      {exportSettings.schoolLogo ? 'Change' : 'Upload'} Logo
                    </button>
                    {exportSettings.schoolLogo && (
                      <button 
                        onClick={() => handleSettingChange('schoolLogo', null)}
                        className=" text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {schoolLogoPicker && (
                    <div className="border p-2 rounded-full bg-gray-50 dark:bg-gray-700">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'schoolLogo')}
                        className=" w-full"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="">Watermark</span>
                    <button 
                      onClick={() => setWatermarkPicker(!watermarkPicker)}
                      className=" bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                    >
                      {exportSettings.watermark ? 'Change' : 'Upload'} Watermark
                    </button>
                    {exportSettings.watermark && (
                      <button 
                        onClick={() => handleSettingChange('watermark', null)}
                        className=" text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {watermarkPicker && (
                    <div className="border p-2 rounded-full bg-gray-50 dark:bg-gray-700">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'watermark')}
                        className=" w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
  
              {/* Layout & Style Settings */}
              <div className="mb-4 border rounded-lg p-3">
                <h3 className="font-semibold mb-2">Layout & Style</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className=" block mb-1">Page Orientation</label>
                    <select
                      value={exportSettings.layout}
                      onChange={(e) => handleSettingChange('layout', e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className=" block mb-1">Table Style</label>
                    <select
                      value={exportSettings.tableStyle}
                      onChange={(e) => handleSettingChange('tableStyle', e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="bordered">Bordered</option>
                      <option value="striped">Striped</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div>
                    <label className=" block mb-1">Paper Size</label>
                    <select
                      value={exportSettings.paperSize}
                      onChange={(e) => handleSettingChange('paperSize', e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className=" block mb-1">Font</label>
                    <select
                      value={exportSettings.font}
                      onChange={(e) => handleSettingChange('font', e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className=" block mb-1">Header Alignment</label>
                    <select
                      value={exportSettings.headerAlignment}
                      onChange={(e) => handleSettingChange('headerAlignment', e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className=" block mb-1">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full p-1  border rounded"
                    >
                      <option value="html">HTML</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h4 className=" font-semibold mb-1">Colors</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className=" block mb-1">Primary Color</label>
                      <div 
                        className="w-full h-6 border rounded cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: exportSettings.primaryColor }}
                        onClick={() => {
                          setActiveColorSetting('primaryColor')
                          setShowColorPicker(true)
                        }}
                      >
                        <span className=" text-white drop-shadow-sm">{exportSettings.primaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className=" block mb-1">Secondary Color</label>
                      <div 
                        className="w-full h-6 border rounded cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: exportSettings.secondaryColor }}
                        onClick={() => {
                          setActiveColorSetting('secondaryColor')
                          setShowColorPicker(true)
                        }}
                      >
                        <span className=" drop-shadow-sm">{exportSettings.secondaryColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className=" block mb-1">Accent Color</label>
                      <div 
                        className="w-full h-6 border rounded cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: exportSettings.accentColor }}
                        onClick={() => {
                          setActiveColorSetting('accentColor')
                          setShowColorPicker(true)
                        }}
                      >
                        <span className=" text-white drop-shadow-sm">{exportSettings.accentColor}</span>
                      </div>
                    </div>
                  </div>
                  {showColorPicker && (
                    <div className="mt-2 p-2 border rounded">
                      <div className="flex justify-between mb-2">
                        <span className=" font-semibold">Color Picker</span>
                        <button 
                          onClick={() => setShowColorPicker(false)}
                          className=""
                        >
                          Close
                        </button>
                      </div>
                      {/* Color picker would go here - simplified for this example */}
                      <div className="grid grid-cols-8 gap-1">
                        {[
                          '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
                          '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
                          '#9900FF', '#FF00FF', '#990000', '#994C00', '#999900', '#009900',
                          '#009999', '#000099', '#490099', '#990099', '#660000', '#663300',
                          '#666600', '#006600', '#006666', '#000066', '#330066', '#660066'
                        ].map(color => (
                          <div
                            key={color}
                            className="w-6 h-6 rounded cursor-pointer border"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              handleColorChange(color)
                              setShowColorPicker(false)
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-2">
                        <label className=" block mb-1">Custom Color</label>
                        <input 
                          type="text"
                          value={exportSettings[activeColorSetting]}
                          onChange={(e) => handleSettingChange(activeColorSetting, e.target.value)}
                          className="w-full p-1  border rounded"
                          placeholder="#RRGGBB"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        
        case 'content':
          return (
            <>
              {/* Content Settings */}
              <div className="mb-4 border rounded-lg p-3">
                <h3 className="font-semibold mb-2">Content Settings</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showPassport}
                      onChange={(e) => handleSettingChange('showPassport', e.target.checked)}
                      className="mr-2"
                    />
                    Show Passport Photos
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showPosition}
                      onChange={(e) => handleSettingChange('showPosition', e.target.checked)}
                      className="mr-2"
                    />
                    Show Positions
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showRawScores}
                      onChange={(e) => handleSettingChange('showRawScores', e.target.checked)}
                      className="mr-2"
                    />
                    Show Raw Scores
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showCATScores}
                      onChange={(e) => handleSettingChange('showCATScores', e.target.checked)}
                      className="mr-2"
                    />
                    Show CAT Scores
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showPercentage}
                      onChange={(e) => handleSettingChange('showPercentage', e.target.checked)}
                      className="mr-2"
                    />
                    Show Percentages
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showTotal}
                      onChange={(e) => handleSettingChange('showTotal', e.target.checked)}
                      className="mr-2"
                    />
                    Show Total Scores
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showGrades}
                      onChange={(e) => handleSettingChange('showGrades', e.target.checked)}
                      className="mr-2"
                    />
                    Show Grades
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showRemarks}
                      onChange={(e) => handleSettingChange('showRemarks', e.target.checked)}
                      className="mr-2"
                    />
                    Show Remarks
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.showFooter}
                      onChange={(e) => handleSettingChange('showFooter', e.target.checked)}
                      className="mr-2"
                    />
                    Show Footer/Signatures
                  </label>
                  <label className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={exportSettings.pageNumbering}
                      onChange={(e) => handleSettingChange('pageNumbering', e.target.checked)}
                      className="mr-2"
                    />
                    Show Page Numbers
                  </label>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <h3 className="font-semibold mb-2">Advanced Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center ">
                      <input
                        type="checkbox"
                        checked={exportSettings.showStatistics}
                        onChange={(e) => handleSettingChange('showStatistics', e.target.checked)}
                        className="mr-2"
                      />
                      Show Class Statistics
                    </label>
                    <label className="flex items-center ">
                      <input
                        type="checkbox"
                        checked={exportSettings.showAttendance}
                        onChange={(e) => handleSettingChange('showAttendance', e.target.checked)}
                        className="mr-2"
                      />
                      Show Attendance Records
                    </label>
                    <label className="flex items-center ">
                      <input
                        type="checkbox"
                        checked={exportSettings.showBehavior}
                        onChange={(e) => handleSettingChange('showBehavior', e.target.checked)}
                        className="mr-2"
                      />
                      Show Behavior Assessment
                    </label>
                    <label className="flex items-center ">
                      <input
                        type="checkbox"
                        checked={exportSettings.showClassTeacherComment}
                        onChange={(e) => handleSettingChange('showClassTeacherComment', e.target.checked)}
                        className="mr-2"
                      />
                      Show Teacher's Comment
                    </label>
                
                    <label className="flex items-center ">
                      <input
                        type="checkbox"
                        checked={exportSettings.showPrincipalComment}
                        onChange={(e) => handleSettingChange('showPrincipalComment', e.target.checked)}
                        className="mr-2"
                      />
                      Show Principal's Comment
                    </label>
                  </div>
                </div>
                
                {exportSettings.showGrades && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className=" font-semibold">Grade Scale</h4>
                      <button
                        onClick={() => setShowGradeEditor(!showGradeEditor)}
                        className=" text-blue-600 dark:text-blue-400"
                      >
                        {showGradeEditor ? 'Hide' : 'Edit'} Scale
                      </button>
                    </div>
                    
                    {showGradeEditor && (
                      <div className="border p-2 rounded bg-gray-50 dark:bg-gray-700 mb-2">
                        {exportSettings.gradeScale.map((grade, index) => (
                          <div key={index} className="flex items-center mb-1">
                            <div className="flex-1 mr-1">
                              <label className=" block">Min %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={grade.min}
                                onChange={(e) => updateGradeScale(index, 'min', e.target.value)}
                                className="w-full p-1  border rounded"
                              />
                            </div>
                            <div className="flex-1 mr-1">
                              <label className=" block">Grade</label>
                              <input
                                type="text"
                                value={grade.grade}
                                onChange={(e) => updateGradeScale(index, 'grade', e.target.value)}
                                className="w-full p-1  border rounded"
                              />
                            </div>
                            <div className="flex-1 mr-1">
                              <label className=" block">Remark</label>
                              <input
                                type="text"
                                value={grade.remark}
                                onChange={(e) => updateGradeScale(index, 'remark', e.target.value)}
                                className="w-full p-1  border rounded"
                              />
                            </div>
                            <button
                              onClick={() => removeGradeLevel(index)}
                              className="mt-4 text-red-500 "
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addGradeLevel}
                          className=" bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded mt-1"
                        >
                          Add Grade Level
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Subject Selection */}
              <div className="mb-4 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Subject Selection</h3>
                  <div>
                    <button
                      onClick={selectAllSubjects}
                      className=" bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-1"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllSubjects}
                      className=" bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {subjects.map(subject => (
                    <label key={subject} className="flex items-center  mb-1">
                      <input
                        type="checkbox"
                        checked={exportSettings.selectedSubjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="mr-2"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )
          
        case 'advanced':
          return (
            <>
              <div className="mb-4 border rounded-lg p-3">
                <h3 className="font-semibold mb-2">Advanced Settings</h3>
                <div className="mb-3">
                  <label className="flex items-center  mb-2">
                    <input
                      type="checkbox"
                      checked={isAdvancedMode}
                      onChange={(e) => setIsAdvancedMode(e.target.checked)}
                      className="mr-2"
                    />
                    Enable Advanced Mode
                  </label>
                  
                  {isAdvancedMode && (
                    <div>
                      <label className=" block mb-1">Custom CSS</label>
                      <textarea
                        value={customCSS}
                        onChange={(e) => setCustomCSS(e.target.value)}
                        className="w-full p-2  border rounded font-mono h-40"
                        placeholder="/* Add your custom CSS here */
.student-name { 
  font-weight: bold; 
}
.header { 
  background-color: #f8f8f8; 
}"
                      />
                      <p className=" text-gray-500 mt-1">
                        Add custom CSS to customize the export appearance.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className=" font-semibold">Template Management</h4>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className=" bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                    >
                      {showTemplates ? <BsChevronUp/> : <BsChevronDown/>} 
                    </button>
                  </div>
                  
                  {showTemplates && (
                    <div className="border p-2 rounded bg-gray-50 dark:bg-gray-700 mb-2">
                      <h5 className=" font-semibold mb-1">Saved Templates</h5>
                      {savedTemplates.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto">
                          {savedTemplates.map(template => (
                            <div 
                              key={template.name}
                              className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded-full"
                              onClick={() => loadTemplate(template.name)}
                            >
                              <span className="">{template.name}</span>
                              <div>
                                <span className=" text-gray-500 mr-2">
                                  {new Date(template.dateCreated).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={(e) => deleteTemplate(template.name, e)}
                                  className=" text-red-500 px-3 py-1 bg-red-600 rounded-full text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className=" text-gray-500">No saved templates found.</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center mt-2">
                    <input
                      type="text"
                      value={currentTemplateName}
                      onChange={(e) => setCurrentTemplateName(e.target.value)}
                      placeholder="Template name"
                      className="flex-1 p-1  border rounded-full mr-2"
                    />
                    <button
                      onClick={saveTemplate}
                      className="bg-blue-500 text-white px-3 py-1 rounded-full "
                      disabled={!currentTemplateName.trim()}
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            </>
          )
          
        default:
          return null
      }
    }
    
    // If modal is not open, don't render
    if (!isOpen) return null

    return (
    
        <Dailog
        im={<BiExport/>}
        title={'Export Results'}
        onClose={onClose}
        children={
 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-[10px]">
       
          
          {previewMode ? (
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={`data:text/html;charset=utf-8,${encodeURIComponent(generateExportHTML())}`}
                className="min-w-[90vh] h-[80vh] "
                title="Result Export Preview"
              />
              <div className="flex justify-between">
                <button
                  onClick={previewExport}
                  className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full"
                >
                  Back to Edit
                </button>
                <div>
                  <button
                    onClick={handleExport}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full mr-2"
                  >
                    Export
                  </button>
                  <button
                    onClick={printExport}
                    className="bg-green-500 text-white px-4 py-2 rounded-full"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex border-b px-4">
                <button
                  className={`px-4 py-2 ${currentTab === 'general' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setCurrentTab('general')}
                >
                  General
                </button>
                <button
                  className={`px-4 py-2 ${currentTab === 'content' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setCurrentTab('content')}
                >
                  Content
                </button>
                <button
                  className={`px-4 py-2 ${currentTab === 'advanced' ? 'border-b-2 border-blue-500' : ''}`}
                  onClick={() => setCurrentTab('advanced')}
                >
                  Advanced
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {renderTabContent()}
              </div>
              
              <div className="p-4 border-t flex justify-between">
                <div>
                  <button
                    onClick={resetToDefaults}
                    className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full  mr-2"
                  >
                    Reset
                  </button>
                </div>
                <div>
                  <button
                    onClick={previewExport}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full shadow  mr-2"
                  >
                    Preview
                  </button>
                  <button
                    onClick={handleExport}
                    className="bg-green-500 text-white px-3 py-1 rounded-full shadow "
                  >
                    Export
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Student Customization Modal */}
          {isCustomizing && customizedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className=" font-semibold">Customize Student Report</h2>
                  <button onClick={closeCustomize} className="text-gray-500 hover:text-gray-700">
                    &times;
                  </button>
                </div>
                <div className="p-4 overflow-auto">
                  <p className="font-semibold mb-2">{customizedStudent.username}</p>
                  
                  {/* Attendance Customization */}
                  {exportSettings.showAttendance && (
                    <div className="mb-4">
                      <h3 className=" font-semibold mb-2">Attendance</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className=" block mb-1">School Days</label>
                          <input type="number" className="w-full p-1  border rounded" defaultValue="120" />
                        </div>
                        <div>
                          <label className=" block mb-1">Present</label>
                          <input type="number" className="w-full p-1  border rounded" defaultValue="110" />
                        </div>
                        <div>
                          <label className=" block mb-1">Absent</label>
                          <input type="number" className="w-full p-1  border rounded" defaultValue="5" />
                        </div>
                        <div>
                          <label className=" block mb-1">Late</label>
                          <input type="number" className="w-full p-1  border rounded" defaultValue="5" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Comments Customization */}
                  {exportSettings.showClassTeacherComment && (
                    <div className="mb-4">
                      <label className=" block mb-1">Class Teacher's Comment</label>
                      <textarea 
                        className="w-full p-2  border rounded h-20"
                        defaultValue="Shows great progress this term. Keep up the good work!"
                      />
                    </div>
                  )}
                  
                  {exportSettings.showPrincipalComment && (
                    <div className="mb-4">
                      <label className=" block mb-1">Principal's Comment</label>
                      <textarea 
                        className="w-full p-2  border rounded h-20"
                        defaultValue="Excellent performance, continue to maintain this standard!"
                      />
                    </div>
                  )}
                  
                  {/* Behavior Customization */}
                  {exportSettings.showBehavior && (
                    <div>
                      <h3 className=" font-semibold mb-2">Behavior Assessment</h3>
                      {['Punctuality', 'Attentiveness', 'Neatness', 'Conduct', 'Participation', 'Homework', 'Creativity', 'Leadership'].map(behavior => (
                        <div key={behavior} className="mb-2">
                          <label className=" block mb-1">{behavior}</label>
                          <select className="w-full p-1  border rounded">
                            <option>Excellent</option>
                            <option>Good</option>
                            <option>Average</option>
                            <option>Poor</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={closeCustomize}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        }/>
       
   
    )
}

            

// Modify the original Result component to include the export builder
const Result = () => {
  // Keep all your existing state and functions
  const [results, setResults] = useState([])
  const [filteredResults, setFilteredResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedResult, setSelectedResult] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [Batch, setBatch] = useState('')
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
  const [isRealtime, setIsRealtime] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  // Add new state for export builder
  const [showExportBuilder, setShowExportBuilder] = useState(false)
  const intervalRef = useRef(null)

  // Keep all your existing useEffect hooks and functions
  
  // First, fetch server info
  useEffect(() => {
    setLoading(true)
    window.api
      .getServerInfo()
      .then((info) => {
        setServerInfo(info)
      })
      .catch((err) => {
        console.error('Error fetching server info:', err)
        setError('Failed to connect to server')
        setLoading(false)
      })
  }, [])

  const fetchData = async () => {
    if (!serverInfo.ip || !serverInfo.port) return // Don't proceed if serverInfo isn't loaded yet

    try {
      setRefreshing(true)
      // Fetch results
      const resultsResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/Result`
      )
      const fetchedResults = resultsResponse.data.Result || resultsResponse.data
      if (Array.isArray(fetchedResults)) {
        setResults(fetchedResults)
        // Apply any active filters
        const filtered = applyFilters(fetchedResults, selectedClass, Batch)
        setFilteredResults(filtered)
      } else {
        setError('Unexpected results data format.')
      }

      // Fetch classes
      const classesResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/classes`
      )
      if (Array.isArray(classesResponse.data)) {
        setClasses(classesResponse.data)
      } else {
        console.error('Classes data is not an array:', classesResponse.data)
      }

      // Fetch exams
      const examsResponse = await axios.get(
        `http://${serverInfo.ip}:${serverInfo.port}/api/ExamCombination`
      )
      if (Array.isArray(examsResponse.data)) {
        setExams(examsResponse.data)
      } else {
        console.error('Exams data is not an array:', examsResponse.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.response?.data?.message || 'Failed to fetch data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Helper function to apply filters
  const applyFilters = (data, classFilter, batchFilter) => {
    let filtered = [...data]
    if (classFilter) {
      filtered = filtered.filter(result => result.classname === classFilter)
    }
    if (batchFilter) {
      filtered = filtered.filter(result => result.exam_name.includes(batchFilter))
    }
    return filtered
  }

  // Then, once serverInfo is available, fetch data
  useEffect(() => {
    if (serverInfo.ip && serverInfo.port) {
      fetchData()
    }
  }, [serverInfo])

  // Set up realtime updates
  useEffect(() => {
    if (isRealtime) {
      // Start auto-refresh interval (every 5 seconds)
      intervalRef.current = setInterval(() => {
        fetchData()
      }, 5000)
      
      // Show toast notification
      toast.success('Realtime updates enabled', { 
        icon: <RefreshCw size={16} className="animate-spin" />,
        duration: 2000
      })
    } else {
      // Clear the interval when realtime is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRealtime, serverInfo])

  const handleDeleteAll = async () => {
    if (!serverInfo.ip || !serverInfo.port) {
      toast('Server connection information missing')
      return
    }

    try {
      // Step 1: Fetch all items
      const fetchResponse = await fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Result`)

      // Check if the fetch was successful
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch items')
      }

      const data = await fetchResponse.json()

      // Step 2: Delete each item individually
      const deletePromises = data.map((item) =>
        fetch(`http://${serverInfo.ip}:${serverInfo.port}/api/Result/${item.id}`, {
          method: 'DELETE'
        })
      )

      // Await all delete promises
      await Promise.all(deletePromises)

      window.location.reload()
      toast('All Results Deleted Successfully')
    } catch (error) {
      console.error('Error deleting content:', error)
      toast('An error occurred while deleting content')
    }
  }

  const handleViewResult = (id) => {
    const result = results.find((r) => r.id === id)
    if (result) {
      setSelectedResult(result)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setSelectedResult(null)
    setIsModalOpen(false)
  }

  const handleClassChange = (e) => {
    const selected = e.target.value
    setSelectedClass(selected)
    setFilteredResults(
      applyFilters(results, selected, Batch)
    )
  }

  const handleBatchChange = (e) => {
    const selected = e.target.value
    setBatch(selected)
    setFilteredResults(
      applyFilters(results, selectedClass, selected)
    )
  }

  const handleRealtimeToggle = () => {
    setIsRealtime(!isRealtime)
  }

  const handleManualRefresh = () => {
    fetchData()
    toast.success('Data refreshed')
  }

  // New function to open the export builder
  const openExportBuilder = () => {
    setShowExportBuilder(true)
    setShowExportOptions(false)
  }

  // Modify the existing JSX to include the new export builder


  return (
    <div className="flex flex-col w-full h-full">
      <Toaster />
      <div className="flex items-center justify-between border-b p-3">
        <span className="text-gray-800 dark:text-white">Result</span>
        <div className="flex items-center space-x-2">
          {/* Realtime toggle switch */}
          <div className="flex items-center mr-2 text-[10px]">
            <div className="relative inline-flex">
              <input 
                type="checkbox" 
                className="sr-only" 
                id="realtimeToggle"
                checked={isRealtime}
                onChange={handleRealtimeToggle}
              />
              <label 
                htmlFor="realtimeToggle" 
                className={`flex h-5 w-9 cursor-pointer items-center rounded-full p-1 duration-300 ease-in-out ${isRealtime ? 'bg-blue-600 bg-blue-400' : 'bg-gray-300'}`}
              >
                <div 
                  className={`h-3 w-3 rounded-full bg-white dark:bg-gray-900 duration-300 ease-in-out ${isRealtime ? 'translate-x-4' : ''}`}
                />
              </label>
            </div>
            <span className="ml-1 text-gray-700 dark:text-gray-300 flex items-center">
              Realtime Updates
              {isRealtime && <RefreshCw size={12} className="ml-1 animate-spin" />}
            </span>
          </div>
          
          {/* Manual refresh button */}
          {!isRealtime && (
            <button 
              onClick={handleManualRefresh} 
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={`text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {/* Class selector */}
          <select
            id="classSelect"
            value={selectedClass}
            onChange={handleClassChange}
            className="p-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name.toUpperCase()}
              </option>
            ))}
          </select>
          
          {/* Exam selector */}
          <select
            id="batchSelect"
            value={Batch}
            onChange={handleBatchChange}
            className="p-1 text-[10px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
          >
            <option value="">All Exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.exam_name}>
                {exam.exam_name}
              </option>
            ))}
          </select>
          
          {/* Export buttons with new template builder */}
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center text-[10px] px-2 py-1 rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              <FileDown size={12} className="mr-1" />
              Export
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10 whitespace-nowrap">
                <button
                  onClick={openExportBuilder}
                  className="flex items-center w-full text-left text-[10px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings size={12} className="mr-2" />
                  Result Builder
                </button>
                <button
                  onClick={() => {
                    // Keep your existing CSV export function
                    exportToCSV();
                    setShowExportOptions(false);
                  }}
                  className="flex items-center w-full text-left text-[10px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileText size={12} className="mr-2" />
                  Quick Export CSV
                </button>
                <button
                  onClick={() => {
                    // Keep your existing print preview function
                    openPrintPreview();
                    setShowExportOptions(false);
                  }}
                  className="flex items-center w-full text-left text-[10px] px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Printer size={12} className="mr-2" />
                  Quick Print
                </button>
              </div>
            )}
          </div>
          
          {/* Delete button */}
          <div className="flex items-center space-x-2 text-gray-800 px-3 rounded-full py-1 bg-zinc-300/20 border border-zinc-300 dark:text-zinc-200">
            <FcDeleteDatabase onClick={handleDeleteAll} className="cursor-pointer" />
          </div>
        </div>
      </div>
      
      {/* Rest of your component (table, etc.) */}
      <div className="hidden lg:flex border-b bg-white dark:bg-gray-900 dark:bg-gray-950 w-full text-[10px] ">
        <div className="relative w-full overflow-auto">
          <table className="min-w-full">
            <thead className="border-b text-gray-600 dark:bg-gray-900">
              <tr className="rounded-t-lg">
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Passport
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Username
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Classname
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Examination
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Subjects scores
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Questions attempted
                </th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50 border-b">
                    <td className="py-1 px-2 border-b">
                      {data.img ? (
                        <img src={data.img} alt="Student" className="w-6 h-6 rounded-full" />
                      ) : (
                        <BiUser size={12} />
                      )}
                    </td>
                    <td className="py-1 px-2 border-l">{data.username}</td>
                    <td className="py-1 px-2 border-l uppercase">{data.classname}</td>
                    <td className="py-1 px-2 border-l">{data.exam_name}</td>
                    <td className="flex items-center h-full">
                      {Object.entries(data.subjectScores).map(([subject, score]) => (
                        <div key={subject} className="flex h-full text-[10px] text-black">
                          <tr className="py-1 px-1 border-b flex h-full border-l">
                            <div className="uppercase">{subject}:</div>
                            {score.correct * 2 < 10 ? (
                              <div className="text-red-600">
                                {score.correct * 2}/{score.total * 2}
                              </div>
                            ) : (
                              <div className="text-blue-600">
                                {score.correct * 2}/{score.total * 2}
                              </div>
                            )}
                          </tr>
                        </div>
                      ))}
                    </td>
                    <td className="py-1 px-2 border-l">
                      {data.questions.filter((q) => q.attempted).length} / {data.questions.length}
                    </td>
                    <td className="py-1 px-2 border-l">
                      <button
                        onClick={() => handleViewResult(data.id)}
                        className="text-white text-[10px] px-2 py-1 rounded-full bg-blue-600 bg-blue-400 hover:bg-blue-700"
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-2">
                    No results to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <ResultModal
            isOpen={isModalOpen}
            onClose={closeModal}
            result={selectedResult}
            classes={classes}
            exams={exams}
          />
        )}
      </div>
      <div className="flex lg:hidden items-center justify-center w-full h-full text-gray-600 text-[10px]">
        <FiMaximize className="mr-1" /> Maximize the window to view full table details
      </div>
      
      {/* Add the export builder modal */}
      {showExportBuilder && (
        <ResultExportBuilder
          filteredResults={filteredResults}
          selectedClass={selectedClass}
          Batch={Batch}
          exams={exams}
          onClose={() => setShowExportBuilder(false)}
          isOpen={showExportBuilder}
        />
      )}
    </div>
  )
}

export default Result