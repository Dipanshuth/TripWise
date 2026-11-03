import io
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_trip_pdf(trip):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    elements.append(Paragraph("TRIPWISE", styles['Title']))
    elements.append(Paragraph("Trip Summary", styles['Heading1']))
    elements.append(Spacer(1, 12))
    
    # Basic Info
    info_data = [
        ["Trip ID:", str(trip.id)],
        ["Source:", trip.source.name if trip.source else 'None'],
        ["Destination:", trip.destination.name if trip.destination else 'None'],
        ["Days:", str(trip.days)],
        ["Travellers:", str(trip.travellers)],
        ["Travel Style:", trip.travel_style.title()],
    ]
    info_table = Table(info_data, colWidths=[100, 300])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Calculate costs
    from trips.services.cost_calculator import CostCalculator
    calc = CostCalculator(trip)
    costs = calc.get_full_breakdown()
    
    elements.append(Paragraph("Cost Breakdown", styles['Heading2']))
    
    def fmt(val_dict):
        v_min = float(val_dict.get('min', 0))
        v_typ = float(val_dict.get('typical', 0))
        v_max = float(val_dict.get('max', 0))
        if v_min == v_max:
            return f"Rs. {v_typ:,.2f}"
        return f"Rs. {v_min:,.2f} - Rs. {v_max:,.2f}"
        
    cost_data = [
        ["Transportation", fmt(costs.get('transportation', {}))],
        ["Accommodation", fmt(costs.get('accommodation', {}))],
        ["Food", fmt(costs.get('food', {}))],
        ["Activities", fmt(costs.get('activities', {}))],
        ["Local Travel", fmt(costs.get('local_travel', {}))],
        ["Custom Expenses", fmt(costs.get('custom', {}))],
        ["Subtotal", fmt(costs.get('subtotal', {}))],
        ["Discount", fmt(costs.get('discount', {}))],
        ["Total", fmt(costs.get('total', {}))],
        ["Per Person", fmt(costs.get('per_person', {}))],
        ["Per Day", fmt(costs.get('per_day', {}))],
    ]
    
    cost_table = Table(cost_data, colWidths=[200, 250])
    cost_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('LINEBELOW', (0,-4), (1,-4), 1, colors.black), # Line above Subtotal
        ('LINEBELOW', (0,-3), (1,-3), 1, colors.black), # Line above Total
        ('FONTNAME', (0,-3), (1,-3), 'Helvetica-Bold'), # Total bold
    ]))
    elements.append(cost_table)
    elements.append(Spacer(1, 20))
    
    # Places
    places = trip.trip_places.all()
    if places:
        elements.append(Paragraph("Selected Places", styles['Heading2']))
        place_data = [["Place", "Category", "Entry Fee"]]
        for tp in places:
            place_data.append([tp.place.name, tp.place.category, fmt(tp.place.entry_fee)])
            
        place_table = Table(place_data, colWidths=[200, 100, 100])
        place_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(place_table)
    
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="tripwise_trip_{trip.id}.pdf"'
    response.write(pdf)
    return response

def generate_expense_pdf(trip):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph("TRIPWISE", styles['Title']))
    elements.append(Paragraph("Expense Report", styles['Heading1']))
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph(f"Trip ID: {trip.id}", styles['Normal']))
    elements.append(Paragraph(f"Destination: {trip.destination.name if trip.destination else 'None'}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    expenses = trip.expenses.all().order_by('-created_at')
    
    if expenses:
        data = [["Expense Name", "Category", "Amount", "Date"]]
        total = 0
        for exp in expenses:
            data.append([
                exp.name,
                exp.category,
                f"Rs. {exp.amount:,.2f}",
                exp.created_at.strftime('%Y-%m-%d')
            ])
            total += exp.amount
            
        data.append(["Total", "", f"Rs. {total:,.2f}", ""])
            
        table = Table(data, colWidths=[150, 100, 100, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('LINEABOVE', (0,-1), (-1,-1), 1, colors.black),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph("No expenses recorded for this trip.", styles['Normal']))
        
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="tripwise_expenses_{trip.id}.pdf"'
    response.write(pdf)
    return response
