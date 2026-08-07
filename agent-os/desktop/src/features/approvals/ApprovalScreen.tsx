import { useState } from "react";

import type {
  AgentNotification,
  ReplyDraft,
} from "../notifications/mockNotifications";

interface ApprovalScreenProps {
  agentName: string;
  notification: AgentNotification & { replyDraft: ReplyDraft };
  onApprove: () => void;
  onBack: () => void;
  onReject: () => void;
  onSaveEdit: (draft: Pick<ReplyDraft, "subject" | "draftBody">) => void;
}

export function ApprovalScreen({
  agentName,
  notification,
  onApprove,
  onBack,
  onReject,
  onSaveEdit,
}: ApprovalScreenProps) {
  const draft = notification.replyDraft;
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.draftBody);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function startEditing() {
    setSubject(draft.subject);
    setBody(draft.draftBody);
    setIsEditing(true);
    setStatusMessage(null);
  }

  function cancelEditing() {
    setSubject(draft.subject);
    setBody(draft.draftBody);
    setIsEditing(false);
  }

  function saveEditing() {
    onSaveEdit({ subject: subject.trim(), draftBody: body.trim() });
    setIsEditing(false);
    setStatusMessage("Draft updated. Confirm before sending.");
  }

  return (
    <section className="approval-screen" aria-labelledby="approval-title">
      <div className="approval-toolbar">
        <button className="text-button" onClick={onBack} type="button">
          Back
        </button>
        <p className="panel-eyebrow">Email reply</p>
      </div>

      <div className="panel-intro approval-intro">
        <div>
          <p className="panel-eyebrow">
            {notification.replyDraft.validationNote}
          </p>
          <h2 id="approval-title">I am going to send this reply</h2>
        </div>
      </div>

      <div className="approval-scroll">
        <div className="approval-card">
          <dl className="approval-meta">
            <div>
              <dt>From</dt>
              <dd>{draft.from}</dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>{draft.to}</dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>
                {isEditing ? (
                  <input
                    aria-label="Reply subject"
                    className="approval-input"
                    onChange={(event) => setSubject(event.target.value)}
                    value={subject}
                  />
                ) : (
                  draft.subject
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="approval-card">
          <h3 className="approval-card__title">Original message</h3>
          <p className="approval-snippet">{draft.originalSnippet}</p>
        </div>

        <div className="approval-card">
          <h3 className="approval-card__title">Draft reply</h3>
          {isEditing ? (
            <textarea
              aria-label="Reply body"
              className="approval-textarea"
              onChange={(event) => setBody(event.target.value)}
              rows={8}
              value={body}
            />
          ) : (
            <pre className="approval-body">{draft.draftBody}</pre>
          )}
        </div>

        {statusMessage && <p className="approval-status">{statusMessage}</p>}
      </div>

      <div className="approval-actions">
        {isEditing ? (
          <>
            <button
              className="primary-button"
              onClick={saveEditing}
              type="button"
            >
              Save and review
            </button>
            <button
              className="secondary-button"
              onClick={cancelEditing}
              type="button"
            >
              Cancel edit
            </button>
          </>
        ) : (
          <>
            <button
              className="primary-button"
              onClick={() => {
                setStatusMessage(`Marked as sent by ${agentName} (mock).`);
                onApprove();
              }}
              type="button"
            >
              Yes, send
            </button>
            <button
              className="secondary-button"
              onClick={startEditing}
              type="button"
            >
              Edit reply
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setStatusMessage("Reply cancelled.");
                onReject();
              }}
              type="button"
            >
              No, cancel
            </button>
          </>
        )}
      </div>
    </section>
  );
}
