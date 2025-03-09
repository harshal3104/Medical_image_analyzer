from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import base64
from PIL import Image
import io
import openai
import random
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")

med_captioning_model = pipeline("image-to-text", model="Salesforce/blip-image-captioning-large")

def determine_medical_image_type(caption):
    """Determine the image type based on medical conditions mentioned in the caption."""
    caption_lower = caption.lower()
    if "x-ray" in caption_lower:
        return "X-ray"
    elif "mri" in caption_lower or "brain scan" in caption_lower:
        return "MRI (Brain Tumor Detection)"
    elif "ultrasound" in caption_lower or "fetus" in caption_lower or "pregnancy" in caption_lower:
        return "Ultrasound (Pregnancy Detection)"
    elif "breast cancer" in caption_lower or "mammogram" in caption_lower:
        return "Mammogram (Breast Cancer Detection)"
    elif "fracture" in caption_lower or "bone" in caption_lower:
        return "X-ray (Fracture Detection)"
    else:
        return "General Medical Image"

def generate_dynamic_context(caption, image_type):
    """Generates an enhanced medical description."""
    prompt = f"""
    Given the medical image caption: "{caption}" and image type: "{image_type}",
    provide an enhanced medical description. Include any notable abnormalities, 
    medical concerns, and potential diagnoses a radiologist might consider.
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=200
    )
    return response['choices'][0]['message']['content'].strip()

def generate_precautions(caption, image_type):
    """Generate medical precautions based on the analysis."""
    prompt = f"""
    Given the medical image caption: "{caption}" and image type: "{image_type}",
    suggest important precautions a patient should take. Include home remedies, 
    necessary medical consultation, and lifestyle changes if required.
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=150
    )
    return response['choices'][0]['message']['content'].strip()

def determine_severity(caption):
    """Estimate injury or disease severity based on the caption."""
    keywords = {"mild": 20, "moderate": 50, "severe": 80, "critical": 95}
    for keyword, severity in keywords.items():
        if keyword in caption.lower():
            return severity
    return random.randint(30, 90)  

# check if the caption is related to medical fields
def is_medical_image(caption):
    """Checks if the caption contains medical-related terms."""
    medical_keywords = ["x-ray", "mri", "ultrasound", "fetus", "pregnancy", "breast cancer", "mammogram", "fracture", "bone", "tumor", "cancer", "radiology","breast","brain","rash"]
    caption_lower = caption.lower()
    return any(keyword in caption_lower for keyword in medical_keywords)


@app.route('/api/analyze-medical-image', methods=['POST'])
def analyze_medical_image():
    try:
        image_data = request.json['image']
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Generate caption
        caption = med_captioning_model(image)[0]['generated_text']
        
        # Check if the caption is medical-related
        if not is_medical_image(caption):
            return jsonify({'error': "Upload a medical-related image."}), 400
        
        
        image_type = determine_medical_image_type(caption)
        enhanced_context = generate_dynamic_context(caption, image_type)
        precautions = generate_precautions(caption, image_type)
        severity = determine_severity(caption)

        return jsonify({
            "altText": caption,
            "imageType": image_type,
            "enhancedContext": enhanced_context,  
            "severity": severity,
            "precautions": precautions
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)