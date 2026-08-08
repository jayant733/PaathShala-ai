BEGIN;
WITH conv AS (
  INSERT INTO conversations (id, user_id, title, created_at)
  VALUES (gen_random_uuid(), 'c8cf553a-e31b-4788-aeb5-a063b7bc0c17', 'Perf Long Conversation', now())
  RETURNING id
)
INSERT INTO messages (id, conversation_id, role, content, created_at)
SELECT gen_random_uuid(),
       (SELECT id FROM conv),
       CASE WHEN (i % 2) = 1 THEN 'user' ELSE 'assistant' END,
       CASE WHEN (i % 2) = 1
            THEN 'What is topic ' || (i/2) || '? Explain it with details and examples.'
            ELSE '# Lesson ' || (i/2) || E'\n## Overview\nHere is a detailed explanation of topic ' || (i/2) || ' with some **bold** and `inline code`.\n- Key idea one\n- Key idea two\n\n| Col A | Col B |\n|---|---|\n| x | y |\n\n```python\ndef f(' || (i/2) || '):\n    return ' || (i/2) || ' * 2\n```\n'
       END,
       now() + (i * interval '1 minute')
FROM generate_series(1, 400) AS i;
COMMIT;
