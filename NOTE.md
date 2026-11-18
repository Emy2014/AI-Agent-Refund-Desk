# Engineering note

> Outline only. The brief asks for this note in your own words, one page. Replace each "Write:" prompt with your answer and delete these quoted lines.

## 1. What happens when the customer submits 2468

> Given a code in the message, the Identity agent returns a tool decision, (verify_identity). When the tool result is a success, it returns a handoff to Refund agent, which calls the issue_refund tool. issue_refund processes the refund only when session.verified is true and the charge has not been refuended before. If the charge was already refunded, it does not refund it again, and the customer sees reference: RF-001.

## 2. One design choice

> In my design, the three agents are deterministic functions, not LLM calls. A deterministic function cannot be persuaded, because it only reacts to fixed patterns such as a 4-digit code. An LLM reads and understands the sentence, so a customer could convince it that they already passed verification when he did not. The real guardrail is the issue_refund tool, which checks session.verified in either design, deterministic agents add predictable behavior on top of that.

## 3. One concrete input or failure the prototype mishandles

> Message that contains both a charge ID and a code together ("refund CH-101, code 2468") ignores the code and asks for it again. See below example,
>
> ```         
> Customer: refund CH-101, code 2468
> Triage → Identity | requested charge CH-101
> Identity asks: "To continue, please enter your 4-digit verification code." | waiting for customer
> ```
>
> Another concern is any 4-digit number is treated as a code attempt, even when it is unrelated, such as the year 2026.

## 
