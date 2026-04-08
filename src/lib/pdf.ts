import jsPDF from 'jspdf'

export interface TokenData {
  tokenNumber: number
  patientName: string
  date: string
  slot: 'morning' | 'evening'
}

export const generateTokenPDF = (data: TokenData) => {
  // Create PDF with small slip size (80mm x 200mm - standard receipt size)
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200]
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Big, bold token number (just the number)
  const bigTokenText = `#${data.tokenNumber}`
  doc.setFontSize(48)
  doc.setFont('helvetica', 'bold')
  
  // Calculate text width for centering
  const textWidth = doc.getTextWidth(bigTokenText)
  const xPos = (pageWidth - textWidth) / 2
  
  // Draw the big bold token number
  doc.text(bigTokenText, xPos, 25)
  
  // Small token number text below
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const smallTokenText = `Token Number: ${data.tokenNumber}`
  const textWidth2 = doc.getTextWidth(smallTokenText)
  const xPos2 = (pageWidth - textWidth2) / 2
  doc.text(smallTokenText, xPos2, 35)
  
  // Token details
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Patient Name: ${data.patientName}`, 5, 45)
  doc.text(`Date: ${data.date}`, 5, 52)
  doc.text(`Slot: ${data.slot.charAt(0).toUpperCase() + data.slot.slice(1)}`, 5, 59)
  
  // Slot time
  const slotTime = data.slot === 'morning' ? '9:00 AM - 1:00 PM' : '6:00 PM - 10:00 PM'
  doc.text(`Time: ${slotTime}`, 5, 66)
  
  // Save the PDF
  doc.save(`token-${data.tokenNumber}-${data.patientName.replace(/\s+/g, '-')}.pdf`)
}

