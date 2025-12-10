from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env into environment variables

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

models = client.models.list()

for m in models.data:
    print(m.id)
