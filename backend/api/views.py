from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Conversation, Session
from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@api_view(["POST"])
def chat(request):
    session_id = request.data.get("session_id", "anonymous")
    user_text = request.data.get("text", "")

    Conversation.objects.create(session_id=session_id, role="user", text=user_text)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": user_text}]
        )
        bot_reply = response.choices[0].message.content
    except Exception as e:
        bot_reply = f"Error: {str(e)}"

    Conversation.objects.create(session_id=session_id, role="assistant", text=bot_reply)

    return Response({"reply": bot_reply})


@api_view(["GET"])
def history(request, session_id):
    messages = Conversation.objects.filter(
        session_id=session_id
    ).order_by("created_at")

    data = [{"role": msg.role, "text": msg.text} for msg in messages]
    return Response({"history": data})


@api_view(["GET"])
def sessions(request):
    all_sessions = Session.objects.order_by("-created_at").values()
    return Response({"sessions": list(all_sessions)})


@api_view(["POST"])
def new_session(request):
    session_id = request.data.get("session_id")

    if not session_id:
        return Response({"error": "session_id missing"}, status=400)

    Session.objects.create(session_id=session_id)

    return Response({"created": True, "session_id": session_id})
