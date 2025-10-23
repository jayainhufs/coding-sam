export default function FeedbackPanel({ feedback }:{ feedback: string }){
    return (
      <aside className="card h-fit">
        <div className="font-semibold mb-2">AI 피드백</div>
        <div className="text-sm whitespace-pre-wrap text-gray-800 min-h-24">
          {feedback || '버튼을 눌러 피드백을 받아보세요.'}
        </div>
      </aside>
    )
  }