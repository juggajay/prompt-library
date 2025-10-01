import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, userAnswer, questionId } = req.body;

    if (!sessionId || !userAnswer || !questionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session data
    const { data: session, error: sessionFetchError } = await supabase
      .from('rule_generation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionFetchError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Save user's response
    const { error: messageInsertError } = await supabase
      .from('rule_conversation_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userAnswer,
        response_data: {
          answeredQuestionId: questionId,
          timestamp: new Date().toISOString()
        }
      });

    if (messageInsertError) {
      console.error('Message insert error:', messageInsertError);
      throw messageInsertError;
    }

    // Update session responses
    const updatedResponses = {
      ...(session.user_responses || {}),
      [questionId]: userAnswer
    };

    const { error: sessionUpdateError } = await supabase
      .from('rule_generation_sessions')
      .update({
        user_responses: updatedResponses,
        current_question_index: session.current_question_index + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      console.error('Session update error:', sessionUpdateError);
      throw sessionUpdateError;
    }

    // Check if we have more questions
    const questionsAsked = session.questions_asked || [];
    const nextQuestionIndex = session.current_question_index + 1;

    if (nextQuestionIndex < questionsAsked.length) {
      // Return next question
      const nextQuestion = questionsAsked[nextQuestionIndex];

      await supabase.from('rule_conversation_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: nextQuestion.text,
        question_data: nextQuestion
      });

      return res.status(200).json({
        success: true,
        hasMoreQuestions: true,
        nextQuestion,
        progress: {
          current: nextQuestionIndex + 1,
          total: questionsAsked.length
        }
      });
    } else {
      // All questions answered - ready to generate rules!
      return res.status(200).json({
        success: true,
        hasMoreQuestions: false,
        shouldGenerateRules: true
      });
    }

  } catch (error: any) {
    console.error('Conversation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Conversation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
