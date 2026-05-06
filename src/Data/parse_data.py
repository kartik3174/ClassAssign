
import json

data = """
Faculty Name		: Dr. A. Rajasekar
MONDAY		20AIPJ801 – Project Phase – II		20AIPL601 – Robotics Lab
TUESDAY				20AIPJ801 – Project Phase – II		20AIPC601 - RPA
WEDNESDAY	20AIPC601 - RPA					20AIPC601 - RPA		
THURSDAY		20AIPC601 - RPA						
FRIDAY			20AIPC601 - RPA				20AIP 601 - IDP

Faculty Name		: Ms.T.Uma Mageswari
MONDAY				20HSMC501 - UHV	20AIPJ801 – Project Phase – II			24AIPC403
- DL
TUESDAY		109106128 – PDB (NPTEL)	20HSMC501 - UHV		20AIPJ801 – Project Phase – II		24AIPC403
- DL	
WEDNESDAY		24AIPC403
- DL					20HSMC501 - UHV	
THURSDAY		24AIPC403
- DL						
FRIDAY	20HSMC501 - UHV					20AIP 601 - IDP

Faculty Name		: Mrs.S.Kirithika
MONDAY	20AITP601 – SE		20AIPW602 - BDA			20AIPC601 - RPA		
TUESDAY	20AIPC601 - RPA	109106128 – PDB (NPTEL)					20AIPW602 - BDA	
WEDNESDAY		20AIPW602 - BDA			20AIPC601 - RPA	
THURSDAY		20AIPC601 - RPA	20AITP601 – SE					
FRIDAY			20AIPC601 - RPA			24AIPT401 - IAI Lab

Faculty Name		: Ms.J.Ilakkiya
MONDAY	20AIEL808 - ARS					20AIEL808 - ARS	20AIEL808 - ARS	
TUESDAY	20AIEL808 - ARS		24AIID401
- IDL - II			20AIEL808 - ARS	
WEDNESDAY	20AIPW603– OTP Lab						20AIEL603 – IRT
THURSDAY	20AIEL603 – IRT			20AIEL603 – IRT		20AIPL601 – Robotics Lab
FRIDAY		20AIEL603 – IRT		20AIEL603 – IRT				

Faculty Name		: Ms.J.Anitha
MONDAY	20CSEL804 -SQA	20AIPJ801 – Project Phase – II		20AIPJ801 – Project Phase – II	20CSEL804 -SQA	20CSEL804 -SQA	
TUESDAY	20CSEL804 -SQA		24AIID401
- IDL - II			20CSEL804 -SQA	
WEDNESDAY			20AIPW602 – BDA Lab				20AIEL608 - ABIS
THURSDAY	20AIEL608 - ABIS			20AIEL608 - ABIS				
FRIDAY		20AIEL608 - ABIS		20AIEL608 - ABIS				

Faculty Name		: Ms. M. Ganga
MONDAY	20AIPW602 - BDA		24AITP401
- AS-II				24AITP401
- AS-II
TUESDAY		24AITP401
- AS-II				20AIPW602 – BDA
WEDNESDAY			20AIPW602 - BDA			24AITP401
- AS-II		20AIEL605 – CNS
THURSDAY	20AIEL605 – CNS			20AIEL605 – CNS				
FRIDAY		20AIEL605 – CNS		20AIEL605 – CNS		20AIP 601 - IDP

Faculty Name		: Dr.S.Parvathi
MONDAY	20AIEL801 - WT&MAD					20AIEL801 - WT&MAD	20AIEL801 - WT&MAD	
TUESDAY	20AIEL801 - WT&MAD		24AIID401
- IDL - II			20AIEL801 - WT&MAD	
WEDNESDAY								
THURSDAY								
FRIDAY								

Faculty Name		: Dr.P.Vijayakumari
MONDAY						20AIPL601 – Robotics Lab
TUESDAY				106106221 – FOC (NPTEL)				
WEDNESDAY								20AIEL602 – WSN
THURSDAY	20AIEL602 – WSN			20AIEL602 – WSN				
FRIDAY		20AIEL602 – WSN		20AIEL602 – WSN			20AIP 601 - IDP	

Faculty Name		: Ms.S.Anusuya
MONDAY		20AIPJ801 – Project Phase – II		20AIPW603– OTP			106106221 – FOC (NPTEL)	20AISR801- Seminar
TUESDAY	20AIPW603– OTP Lab				20AIPW603– OTP		24AIPC402
- DEV
WEDNESDAY			24AIPC402
- DEV					
THURSDAY						24AIPC402
- DEV		20AIPW603– OTP
FRIDAY		24AIPC402
- DEV				20AIP 601 - IDP

Faculty Name		: Ms.D.Madhi Vadhani
MONDAY				24AIPC402
- DEV				20AIPW603– OTP
TUESDAY		24AIPC402
- DEV			20AIPJ801 – Project Phase – II		20AIPW602 – BDA Lab
WEDNESDAY	20AIPW603– OTP Lab				20AIPW603– OTP		
THURSDAY						24AIPC402
- DEV		
FRIDAY		20AIPW603– OTP						24AIPC402
- DEV

Faculty Name		: Dr. A. Raja Brundha
WEDNESDAY	24AIPC403
- DL			24AIPC403
- DL				
THURSDAY		24AIPL401 - DL Lab			24AIPC403
- DL	
FRIDAY				24AIPC403
- DL		20AIPJ601 - IDP

Faculty Name		: Ms.R.Krishnapriya
MONDAY								20AISR801- Seminar
TUESDAY			20AITP601 – SE					
WEDNESDAY						24AIPL401 - DL Lab
THURSDAY				106105195 – II&IIoT (NPTEL)				
FRIDAY	20AITP601 – SE							

Faculty Name		: Ms. R. Noousheen
MONDAY	24AITP401
- AS-II				106105195 – II&IIoT (NPTEL)		
TUESDAY		20AIPJ801 – Project Phase – II		20AIPJ801 – Project Phase – II			20AISR801- Seminar
WEDNESDAY			24AITP401
- AS-II					
THURSDAY								
FRIDAY		24AIPT401 - IAI Lab		24AITP401
- AS-II		

Faculty Name		: Ms.R.Vijayalakshmi
MONDAY	20AIEL802 -IDM					20AIEL802 -IDM	20AIEL802 -IDM	
TUESDAY	20AIEL802 -IDM						20AIEL802 -IDM	20AISR801- Seminar
THURSDAY		24AIPL401 - DL Lab				

Faculty Name		: Dr. C.R. Senthilnathan
MONDAY							24MGOE904
- LIS	
TUESDAY								24MGOE904
- LIS
WEDNESDAY				24MGOE904
- LIS				

Faculty Name		: Dr.K.Baranidharan
MONDAY							24MGOE904
- LIS	
TUESDAY	24MGOE904
- LIS							
WEDNESDAY							24MGOE904
- LIS	

Faculty Name		: Dr. R. Avudainayaki
MONDAY			24BSMA404
- LAA					
TUESDAY						24BSMA404
- LAA		
THURSDAY			24BSMA404
- LAA				24BSMA404
- LAA	
FRIDAY							24BSMA404
- LAA	

Faculty Name		: Dr. M. Devendran
MONDAY		24BSMA404
- LAA						
TUESDAY						24BSMA404
- LAA		
WEDNESDAY		24BSMA404
- LAA						
THURSDAY								24BSMA404
- LAA
FRIDAY			24BSMA404
- LAA					
"""

# I need to manually map the text columns to slots.
# Text is tab separated mostly.
# I'll create a dictionary for each staff member.

staff_timetables = {}
current_staff = None

lines = data.strip().split('\n')
i = 0
while i < len(lines):
    line = lines[i].strip()
    if line.startswith("Faculty Name"):
        current_staff = line.split(":")[1].strip()
        staff_timetables[current_staff] = {day: [None]*7 for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
    elif any(day in line.upper() for day in ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]):
        # This is a bit tricky due to format.
        # I'll manually code the slots based on visual inspection of the user request.
        pass
    i += 1

# Manual data entry for accuracy based on the user's text dump structure.
# I will use the mapping: I->0, II->1, III->2, IV->3, VI->4, VII->5, VIII->6. (Skipping V)

# Dr. A. Rajasekar
staff_timetables["Dr. A. Rajasekar"]["Monday"] = [None, "PP-II", None, None, None, "Robotics Lab", None]
staff_timetables["Dr. A. Rajasekar"]["Tuesday"] = [None, null, null, "PP-II", null, "RPA", null] # wait null is not defined in python
# Correcting...
# (Mental mapping from the dump)

def get_empty():
    return [None]*7

s = staff_timetables

s["Dr. A. Rajasekar"]["Monday"] = [None, "PP-II", None, None, None, "Robotics Lab", None]
s["Dr. A. Rajasekar"]["Tuesday"] = [None, None, None, "PP-II", None, "RPA", None]
s["Dr. A. Rajasekar"]["Wednesday"] = ["RPA", None, None, None, "RPA", None, None]
s["Dr. A. Rajasekar"]["Thursday"] = [None, "RPA", None, None, None, None, None]
s["Dr. A. Rajasekar"]["Friday"] = [None, None, "RPA", None, None, "IDP", None]

s["Ms.T.Uma Mageswari"]["Monday"] = [None, None, None, "UHV", None, None, "DL"]
s["Ms.T.Uma Mageswari"]["Tuesday"] = [None, "PDB", "UHV", None, None, "DL", None]
s["Ms.T.Uma Mageswari"]["Wednesday"] = [None, "DL", None, None, None, "UHV", None]
s["Ms.T.Uma Mageswari"]["Thursday"] = [None, "DL", None, None, None, None, None]
s["Ms.T.Uma Mageswari"]["Friday"] = ["UHV", None, None, None, None, "IDP", None]

s["Mrs.S.Kirithika"]["Monday"] = ["SE", None, "BDA", None, "RPA", None, None]
s["Mrs.S.Kirithika"]["Tuesday"] = ["RPA", "PDB", None, None, None, "BDA", None]
s["Mrs.S.Kirithika"]["Wednesday"] = [None, "BDA", None, None, "RPA", None, None]
s["Mrs.S.Kirithika"]["Thursday"] = [None, "RPA", "SE", None, None, None, None]
s["Mrs.S.Kirithika"]["Friday"] = [None, None, "RPA", None, None, "IAI Lab", None]

s["Ms.J.Ilakkiya"]["Monday"] = ["ARS", None, None, None, "ARS", "ARS", None]
s["Ms.J.Ilakkiya"]["Tuesday"] = ["ARS", None, "IDL-II", None, None, "ARS", None]
s["Ms.J.Ilakkiya"]["Wednesday"] = ["OTP Lab", None, None, None, None, "IRT", None]
s["Ms.J.Ilakkiya"]["Thursday"] = ["IRT", None, None, "IRT", None, "Robotics Lab", None]
s["Ms.J.Ilakkiya"]["Friday"] = [None, "IRT", None, "IRT", None, None, None]

s["Ms.J.Anitha"]["Monday"] = ["SQA", "PP-II", None, "PP-II", "SQA", "SQA", None]
s["Ms.J.Anitha"]["Tuesday"] = ["SQA", None, "IDL-II", None, None, "SQA", None]
s["Ms.J.Anitha"]["Wednesday"] = [None, None, "BDA Lab", None, None, "ABIS", None]
s["Ms.J.Anitha"]["Thursday"] = ["ABIS", None, None, "ABIS", None, None, None]
s["Ms.J.Anitha"]["Friday"] = [None, "ABIS", None, "ABIS", None, None, None]

s["Ms. M. Ganga"]["Monday"] = ["BDA", None, "AS-II", None, None, None, "AS-II"]
s["Ms. M. Ganga"]["Tuesday"] = [None, "AS-II", None, None, None, "BDA", None]
s["Ms. M. Ganga"]["Wednesday"] = [None, None, "BDA", None, "AS-II", None, "CNS"]
s["Ms. M. Ganga"]["Thursday"] = ["CNS", None, None, "CNS", None, None, None]
s["Ms. M. Ganga"]["Friday"] = [None, "CNS", None, "CNS", None, "IDP", None]

s["Dr.S.Parvathi"]["Monday"] = ["WT&MAD", None, None, None, "WT&MAD", "WT&MAD", None]
s["Dr.S.Parvathi"]["Tuesday"] = ["WT&MAD", None, "IDL-II", None, None, "WT&MAD", None]

s["Dr.P.Vijayakumari"]["Monday"] = [None, None, None, None, None, "Robotics Lab", None]
s["Dr.P.Vijayakumari"]["Tuesday"] = [None, None, None, "FOC", None, None, None]
s["Dr.P.Vijayakumari"]["Wednesday"] = [None, None, None, None, None, None, "WSN"]
s["Dr.P.Vijayakumari"]["Thursday"] = ["WSN", None, None, "WSN", None, None, None]
s["Dr.P.Vijayakumari"]["Friday"] = [None, "WSN", None, "WSN", None, "IDP", None]

s["Ms.S.Anusuya"]["Monday"] = [None, "PP-II", None, "OTP", None, "FOC", "Seminar"]
s["Ms.S.Anusuya"]["Tuesday"] = ["OTP Lab", None, None, None, "OTP", "DEV", None]
s["Ms.S.Anusuya"]["Wednesday"] = [None, None, "DEV", None, None, None, None]
s["Ms.S.Anusuya"]["Thursday"] = [None, None, None, None, "DEV", None, "OTP"]
s["Ms.S.Anusuya"]["Friday"] = [None, "DEV", None, None, None, "IDP", None]

s["Ms.D.Madhi Vadhani"]["Monday"] = [None, None, None, "DEV", None, None, "OTP"]
s["Ms.D.Madhi Vadhani"]["Tuesday"] = [None, "DEV", None, "PP-II", None, "BDA Lab", None]
s["Ms.D.Madhi Vadhani"]["Wednesday"] = ["OTP Lab", None, None, None, "OTP", None, None]
s["Ms.D.Madhi Vadhani"]["Thursday"] = [None, None, None, None, "DEV", None, None]
s["Ms.D.Madhi Vadhani"]["Friday"] = [None, "OTP", None, None, None, "DEV", None]

s["Dr. A. Raja Brundha"]["Wednesday"] = ["DL", None, None, "DL", None, None, None]
s["Dr. A. Raja Brundha"]["Thursday"] = [None, "DL Lab", None, None, "DL", None, None]
s["Dr. A. Raja Brundha"]["Friday"] = [None, None, None, "DL", None, "IDP", None]

s["Ms.R.Krishnapriya"]["Monday"] = [None, None, None, None, None, None, "Seminar"]
s["Ms.R.Krishnapriya"]["Tuesday"] = [None, None, "SE", None, None, None, None]
s["Ms.R.Krishnapriya"]["Wednesday"] = [None, None, None, None, None, "DL Lab", None]
s["Ms.R.Krishnapriya"]["Thursday"] = [None, None, None, "Industry 4.0", None, None, None]
s["Ms.R.Krishnapriya"]["Friday"] = ["SE", None, None, None, None, None, None]

s["Ms. R. Noousheen"]["Monday"] = ["AS-II", None, None, None, "Industry 4.0", None, None]
s["Ms. R. Noousheen"]["Tuesday"] = [None, "PP-II", None, "PP-II", None, None, "Seminar"]
s["Ms. R. Noousheen"]["Wednesday"] = [None, None, "AS-II", None, None, None, None]
s["Ms. R. Noousheen"]["Friday"] = [None, "IAI Lab", None, None, "AS-II", None, None]

s["Ms.R.Vijayalakshmi"]["Monday"] = ["IDM", None, None, None, "IDM", "IDM", None]
s["Ms.R.Vijayalakshmi"]["Tuesday"] = ["IDM", None, None, None, None, "IDM", "Seminar"]
s["Ms.R.Vijayalakshmi"]["Thursday"] = [None, "DL Lab", None, None, None, None, None]

s["Dr. C.R. Senthilnathan"]["Monday"] = [None, None, None, None, None, "LIS", None]
s["Dr. C.R. Senthilnathan"]["Tuesday"] = [None, None, None, None, None, None, "LIS"]
s["Dr. C.R. Senthilnathan"]["Wednesday"] = [None, None, None, "LIS", None, None, None]

s["Dr.K.Baranidharan"]["Monday"] = [None, None, None, None, None, "LIS", None]
s["Dr.K.Baranidharan"]["Tuesday"] = ["LIS", None, None, None, None, None, None]
s["Dr.K.Baranidharan"]["Wednesday"] = [None, None, None, None, None, "LIS", None]

s["Dr. R. Avudainayaki"]["Monday"] = [None, None, "LAA", None, None, None, None]
s["Dr. R. Avudainayaki"]["Tuesday"] = [None, None, None, None, "LAA", None, None]
s["Dr. R. Avudainayaki"]["Thursday"] = [None, None, "LAA", None, None, "LAA", None]
s["Dr. R. Avudainayaki"]["Friday"] = [None, None, None, None, None, "LAA", None]

s["Dr. M. Devendran"]["Monday"] = [None, "LAA", None, None, None, None, None]
s["Dr. M. Devendran"]["Tuesday"] = [None, None, None, None, "LAA", None, None]
s["Dr. M. Devendran"]["Wednesday"] = [None, "LAA", None, None, None, None, None]
s["Dr. M. Devendran"]["Thursday"] = [None, None, None, None, None, None, "LAA"]
s["Dr. M. Devendran"]["Friday"] = [None, None, "LAA", None, None, None, None]

print(json.dumps(staff_timetables, indent=2))
