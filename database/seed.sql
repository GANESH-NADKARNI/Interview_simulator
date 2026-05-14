-- ─────────────────────────────────────────────────────────────
-- Seed Data - Sample Problems & Test Cases
-- ─────────────────────────────────────────────────────────────
USE interview_sim;

-- Admin user (password: Admin123!)
INSERT IGNORE INTO users (username, email, password, role) VALUES
('admin', 'admin@interviewsim.com',
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBpwTTyU9T0nes', 'ADMIN');

-- ─── Problem 1: Two Sum (Easy) ─────────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Two Sum',
  'two-sum',
  '## Two Sum\n\nGiven an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
  'EASY',
  'Arrays',
  '- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.',
  '[{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9"},{"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}]',
  '{"python": "import sys\n\nline1 = input().split()\nnums = list(map(int, line1[:-1]))\ntarget = int(line1[-1])\n\ndef twoSum(nums, target):\n    # Your code here\n    pass\n\nprint(twoSum(nums, target))", "javascript": "const lines = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '');\nconst target = parseInt(lines.pop());\nconst nums = lines.map(Number);\n\nfunction twoSum(nums, target) {\n  // Your code here\n}\n\nconsole.log(JSON.stringify(twoSum(nums, target)));", "java": "import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String[] parts = sc.nextLine().split(\" \");\n    int n = parts.length;\n    int target = Integer.parseInt(parts[n-1]);\n    int[] nums = new int[n-1];\n    for(int i=0;i<n-1;i++) nums[i]=Integer.parseInt(parts[i]);\n    // Your twoSum logic here\n    System.out.println(Arrays.toString(new int[]{0,1}));\n  }\n}"}',
  3000,
  256
);

SET @p1 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p1, '2 7 11 15 9',  '[0, 1]', FALSE, 0),
(@p1, '3 2 4 6',      '[1, 2]', FALSE, 1),
(@p1, '3 3 6',        '[0, 1]', FALSE, 2),
(@p1, '-1 -2 -3 -4 -5 -8', '[2, 4]', TRUE,  3),
(@p1, '0 4 3 0 0',    '[0, 3]', TRUE,  4);

-- ─── Problem 2: Valid Parentheses (Easy) ──────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Valid Parentheses',
  'valid-parentheses',
  '## Valid Parentheses\n\nGiven a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
  'EASY',
  'Stacks',
  '- 1 <= s.length <= 10^4\n- s consists of parentheses only "()[]{}"',
  '[{"input": "s = \"()\"", "output": "true"},{"input": "s = \"()[]{}\"", "output": "true"},{"input": "s = \"(]\"", "output": "false"}]',
  '{"python": "s = input().strip()\n\ndef isValid(s):\n    # Your code here\n    pass\n\nprint(str(isValid(s)).lower())", "javascript": "const s = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim();\n\nfunction isValid(s) {\n  // Your code here\n}\n\nconsole.log(isValid(s));", "java": "import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.nextLine().trim();\n    // Your isValid logic here\n    System.out.println(false);\n  }\n}"}',
  3000,
  256
);

SET @p2 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p2, '()',      'true',  FALSE, 0),
(@p2, '()[]{}', 'true',  FALSE, 1),
(@p2, '(]',     'false', FALSE, 2),
(@p2, '([)]',   'false', TRUE,  3),
(@p2, '{[]}',   'true',  TRUE,  4);

-- ─── Problem 3: Reverse Linked List (Easy) ────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Reverse Linked List',
  'reverse-linked-list',
  '## Reverse Linked List\n\nGiven the head of a singly linked list, reverse the list, and return the reversed list.\n\nInput is given as space-separated integers representing the linked list values.\nOutput should be the reversed list as space-separated integers.',
  'EASY',
  'Linked Lists',
  '- The number of nodes in the list is in the range [0, 5000]\n- -5000 <= Node.val <= 5000',
  '[{"input": "1 2 3 4 5", "output": "5 4 3 2 1"},{"input": "1 2", "output": "2 1"},{"input": "", "output": ""}]',
  '{"python": "line = input().strip()\nnums = list(map(int, line.split())) if line else []\n\ndef reverseList(nums):\n    # Your code here\n    return nums[::-1]\n\nresult = reverseList(nums)\nprint('' ''.join(map(str, result)))", "javascript": "const line = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim();\nconst nums = line ? line.split('' '').map(Number) : [];\n\nfunction reverseList(nums) {\n  // Your code here\n  return nums.reverse();\n}\n\nconsole.log(reverseList(nums).join('' ''));"}',
  3000,
  256
);

SET @p3 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p3, '1 2 3 4 5', '5 4 3 2 1', FALSE, 0),
(@p3, '1 2',       '2 1',       FALSE, 1),
(@p3, '1',         '1',         FALSE, 2),
(@p3, '5 4 3 2 1', '1 2 3 4 5', TRUE,  3);

-- ─── Problem 4: Maximum Subarray (Medium) ─────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Maximum Subarray',
  'maximum-subarray',
  '## Maximum Subarray\n\nGiven an integer array `nums`, find the **subarray** with the largest sum, and return its sum.\n\nA subarray is a contiguous part of an array.',
  'MEDIUM',
  'Dynamic Programming',
  '- 1 <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4',
  '[{"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."},{"input": "nums = [1]", "output": "1"},{"input": "nums = [5,4,-1,7,8]", "output": "23"}]',
  '{"python": "nums = list(map(int, input().split()))\n\ndef maxSubArray(nums):\n    # Kadane''s algorithm\n    # Your code here\n    pass\n\nprint(maxSubArray(nums))", "javascript": "const nums = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '').map(Number);\n\nfunction maxSubArray(nums) {\n  // Kadane''s algorithm\n  // Your code here\n}\n\nconsole.log(maxSubArray(nums));"}',
  5000,
  256
);

SET @p4 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p4, '-2 1 -3 4 -1 2 1 -5 4', '6',   FALSE, 0),
(@p4, '1',                      '1',   FALSE, 1),
(@p4, '5 4 -1 7 8',            '23',  FALSE, 2),
(@p4, '-1',                     '-1',  TRUE,  3),
(@p4, '-2 -1',                  '-1',  TRUE,  4);

-- ─── Problem 5: Binary Search (Easy) ─────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Binary Search',
  'binary-search',
  '## Binary Search\n\nGiven an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.\n\nIf `target` exists, return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.\n\nInput format: First line is the sorted array, second line is the target.',
  'EASY',
  'Binary Search',
  '- 1 <= nums.length <= 10^4\n- -10^4 < nums[i], target < 10^4\n- All the integers in nums are unique\n- nums is sorted in ascending order',
  '[{"input": "nums=[-1,0,3,5,9,12], target=9", "output": "4"},{"input": "nums=[-1,0,3,5,9,12], target=2", "output": "-1"}]',
  '{"python": "parts = input().split()\ntarget = int(parts[-1])\nnums = list(map(int, parts[:-1]))\n\ndef search(nums, target):\n    # Your binary search here\n    pass\n\nprint(search(nums, target))", "javascript": "const parts = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '');\nconst target = parseInt(parts.pop());\nconst nums = parts.map(Number);\n\nfunction search(nums, target) {\n  // Your binary search here\n}\n\nconsole.log(search(nums, target));"}',
  3000,
  256
);

SET @p5 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p5, '-1 0 3 5 9 12 9', '4',  FALSE, 0),
(@p5, '-1 0 3 5 9 12 2', '-1', FALSE, 1),
(@p5, '5 5',              '0',  FALSE, 2),
(@p5, '1 2 3 4 5 6 7 8 9 10 7', '6', TRUE, 3);

-- ─── Problem 6: Climbing Stairs (Easy) ───────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Climbing Stairs',
  'climbing-stairs',
  '## Climbing Stairs\n\nYou are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
  'EASY',
  'Dynamic Programming',
  '- 1 <= n <= 45',
  '[{"input": "n = 2", "output": "2", "explanation": "1+1 or 2"},{"input": "n = 3", "output": "3", "explanation": "1+1+1, 1+2, 2+1"}]',
  '{"python": "n = int(input())\n\ndef climbStairs(n):\n    # Your DP solution here\n    pass\n\nprint(climbStairs(n))", "javascript": "const n = parseInt(require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim());\n\nfunction climbStairs(n) {\n  // Your DP solution here\n}\n\nconsole.log(climbStairs(n));"}',
  3000,
  256
);

SET @p6 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p6, '2',  '2',    FALSE, 0),
(@p6, '3',  '3',    FALSE, 1),
(@p6, '1',  '1',    FALSE, 2),
(@p6, '10', '89',   TRUE,  3),
(@p6, '45', '1836311903', TRUE, 4);

-- ─── Problem 7: Merge Intervals (Medium) ─────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Merge Intervals',
  'merge-intervals',
  '## Merge Intervals\n\nGiven an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\nInput format: Pairs of numbers separated by spaces (e.g., `1 3 2 6 8 10 15 18`).',
  'MEDIUM',
  'Arrays',
  '- 1 <= intervals.length <= 10^4\n- intervals[i].length == 2\n- 0 <= starti <= endi <= 10^4',
  '[{"input": "1 3 2 6 8 10 15 18", "output": "1 6 8 10 15 18"},{"input": "1 4 4 5", "output": "1 5"}]',
  '{"python": "nums = list(map(int, input().split()))\nintervals = [[nums[i], nums[i+1]] for i in range(0, len(nums), 2)]\n\ndef merge(intervals):\n    # Your code here\n    pass\n\nresult = merge(intervals)\nprint('' ''.join(str(x) for pair in result for x in pair))", "javascript": "const nums = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '').map(Number);\nconst intervals = [];\nfor(let i=0;i<nums.length;i+=2) intervals.push([nums[i],nums[i+1]]);\n\nfunction merge(intervals) {\n  // Your code here\n}\n\nconsole.log(merge(intervals).flat().join('' ''));"}',
  5000,
  256
);

SET @p7 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p7, '1 3 2 6 8 10 15 18', '1 6 8 10 15 18', FALSE, 0),
(@p7, '1 4 4 5',             '1 5',            FALSE, 1),
(@p7, '1 4 0 4',             '0 4',            TRUE,  2),
(@p7, '1 4 2 3',             '1 4',            TRUE,  3);

SELECT 'Seed data inserted successfully!' AS message;
SELECT COUNT(*) AS total_problems FROM problems;
SELECT COUNT(*) AS total_test_cases FROM test_cases;

-- ─── Problem 8: Add Two Numbers ───────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Add Two Numbers',
  'add-two-numbers',
  '## Add Two Numbers\n\nGiven two integers `a` and `b`, return their sum.\n\nInput format: Two numbers on one line separated by a space.',
  'EASY',
  'Math',
  '- -10^9 <= a, b <= 10^9',
  '[{"input": "3 5", "output": "8", "explanation": "3 + 5 = 8"},{"input": "-1 7", "output": "6", "explanation": "-1 + 7 = 6"}]',
  '{"python": "a, b = map(int, input().split())\n\ndef addTwo(a, b):\n    # Your code here\n    pass\n\nprint(addTwo(a, b))", "javascript": "const [a, b] = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '').map(Number);\n\nfunction addTwo(a, b) {\n  // Your code here\n}\n\nconsole.log(addTwo(a, b));"}',
  2000,
  256
);

SET @p8 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p8, '3 5',        '8',           FALSE, 0),
(@p8, '-1 7',       '6',           FALSE, 1),
(@p8, '0 0',        '0',           FALSE, 2),
(@p8, '100 200',    '300',         TRUE,  3),
(@p8, '-500 500',   '0',           TRUE,  4);

-- ─── Problem 9: Binary Search ─────────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Binary Search',
  'binary-search-basic',
  '## Binary Search\n\nGiven a **sorted** array of integers and a target value, return the index of the target. If the target is not found, return `-1`.\n\nInput format: First line contains the sorted numbers separated by spaces. Second line contains the target.',
  'EASY',
  'Binary Search',
  '- 1 <= nums.length <= 10^4\n- All values in nums are unique\n- nums is sorted in ascending order',
  '[{"input": "1 3 5 7 9\n7", "output": "3", "explanation": "7 is at index 3"},{"input": "1 3 5 7 9\n6", "output": "-1", "explanation": "6 is not in the array"}]',
  '{"python": "nums = list(map(int, input().split()))\ntarget = int(input())\n\ndef binarySearch(nums, target):\n    # Your code here\n    pass\n\nprint(binarySearch(nums, target))", "javascript": "const lines = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split(''\\n'');\nconst nums = lines[0].split('' '').map(Number);\nconst target = Number(lines[1]);\n\nfunction binarySearch(nums, target) {\n  // Your code here\n}\n\nconsole.log(binarySearch(nums, target));"}',
  3000,
  256
);

SET @p9 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p9, '1 3 5 7 9\n7',       '3',  FALSE, 0),
(@p9, '1 3 5 7 9\n6',       '-1', FALSE, 1),
(@p9, '2 4 6 8 10\n2',      '0',  FALSE, 2),
(@p9, '1 2 3 4 5 6 7 8\n5', '4',  TRUE,  3),
(@p9, '10 20 30 40 50\n50', '4',  TRUE,  4);

-- ─── Problem 10: Bubble Sort ──────────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Bubble Sort',
  'bubble-sort',
  '## Bubble Sort\n\nGiven an array of integers, sort it in **ascending order** using bubble sort and return the sorted array.\n\nInput format: Numbers separated by spaces on one line.',
  'EASY',
  'Sorting',
  '- 1 <= nums.length <= 100\n- -1000 <= nums[i] <= 1000',
  '[{"input": "5 3 1 4 2", "output": "1 2 3 4 5", "explanation": "Sorted ascending"},{"input": "9 1 8 2 7", "output": "1 2 7 8 9"}]',
  '{"python": "nums = list(map(int, input().split()))\n\ndef bubbleSort(nums):\n    # Your bubble sort here\n    pass\n\nresult = bubbleSort(nums)\nprint('' ''.join(map(str, result)))", "javascript": "const nums = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split('' '').map(Number);\n\nfunction bubbleSort(nums) {\n  // Your bubble sort here\n}\n\nconsole.log(bubbleSort(nums).join('' ''));"}',
  3000,
  256
);

SET @p10 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p10, '5 3 1 4 2',    '1 2 3 4 5',    FALSE, 0),
(@p10, '9 1 8 2 7',    '1 2 7 8 9',    FALSE, 1),
(@p10, '1',            '1',            FALSE, 2),
(@p10, '3 3 3 1 2',    '1 2 3 3 3',    TRUE,  3),
(@p10, '-5 0 3 -2 1',  '-5 -2 0 1 3',  TRUE,  4);

-- ─── Problem 11: Stack Push Pop ───────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Stack Operations',
  'stack-operations',
  '## Stack Operations\n\nImplement a basic stack and process a series of operations.\n\nOperations:\n- `PUSH x` — push integer x onto the stack\n- `POP` — remove and print the top element. Print `-1` if stack is empty\n- `TOP` — print the top element without removing it. Print `-1` if stack is empty\n\nInput format: First line is number of operations N, followed by N lines of operations.',
  'EASY',
  'Stack',
  '- 1 <= N <= 100\n- 1 <= x <= 1000',
  '[{"input": "4\nPUSH 5\nPUSH 3\nPOP\nTOP", "output": "3\n5", "explanation": "POP returns 3, TOP returns 5"},{"input": "2\nPOP\nPUSH 1", "output": "-1", "explanation": "POP on empty stack returns -1"}]',
  '{"python": "n = int(input())\nstack = []\n\nfor _ in range(n):\n    op = input().split()\n    if op[0] == ''PUSH'':\n        # Push op[1] onto stack\n        pass\n    elif op[0] == ''POP'':\n        # Pop and print top, or -1\n        pass\n    elif op[0] == ''TOP'':\n        # Print top without removing, or -1\n        pass", "javascript": "const lines = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim().split(''\\n'');\nconst n = parseInt(lines[0]);\nconst stack = [];\nconst output = [];\n\nfor (let i = 1; i <= n; i++) {\n  const op = lines[i].split('' '');\n  if (op[0] === ''PUSH'') {\n    // push op[1]\n  } else if (op[0] === ''POP'') {\n    // pop and add to output\n  } else if (op[0] === ''TOP'') {\n    // peek and add to output\n  }\n}\nconsole.log(output.join(''\\n''));"}',
  3000,
  256
);

SET @p11 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p11, '4\nPUSH 5\nPUSH 3\nPOP\nTOP',              '3\n5',       FALSE, 0),
(@p11, '2\nPOP\nPUSH 1',                            '-1',         FALSE, 1),
(@p11, '3\nPUSH 10\nTOP\nPOP',                      '10\n10',     FALSE, 2),
(@p11, '5\nPUSH 1\nPUSH 2\nPUSH 3\nPOP\nPOP',      '3\n2',       TRUE,  3),
(@p11, '3\nPOP\nPOP\nPUSH 5',                       '-1\n-1',     TRUE,  4);

-- ─── Problem 12: Fibonacci Number ─────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Fibonacci Number',
  'fibonacci-number',
  '## Fibonacci Number\n\nGiven `n`, return the nth Fibonacci number.\n\nThe Fibonacci sequence: `0, 1, 1, 2, 3, 5, 8, 13, 21, ...`\n\nF(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)',
  'EASY',
  'Dynamic Programming',
  '- 0 <= n <= 30',
  '[{"input": "4", "output": "3", "explanation": "F(4) = F(3)+F(2) = 2+1 = 3"},{"input": "7", "output": "13"}]',
  '{"python": "n = int(input())\n\ndef fib(n):\n    # Your code here\n    pass\n\nprint(fib(n))", "javascript": "const n = parseInt(require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim());\n\nfunction fib(n) {\n  // Your code here\n}\n\nconsole.log(fib(n));"}',
  3000,
  256
);

SET @p12 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p12, '0',  '0',   FALSE, 0),
(@p12, '1',  '1',   FALSE, 1),
(@p12, '4',  '3',   FALSE, 2),
(@p12, '7',  '13',  TRUE,  3),
(@p12, '10', '55',  TRUE,  4);

-- ─── Problem 13: Palindrome Check ─────────────────────────────
INSERT IGNORE INTO problems (title, slug, description, difficulty, category, constraints, examples, starter_code, time_limit, memory_limit) VALUES
(
  'Palindrome Check',
  'palindrome-check',
  '## Palindrome Check\n\nGiven a string, return `True` if it is a palindrome, or `False` otherwise.\n\nA palindrome reads the same forwards and backwards. Ignore case and spaces.',
  'EASY',
  'Strings',
  '- 1 <= s.length <= 1000\n- s contains only alphanumeric characters and spaces',
  '[{"input": "racecar", "output": "True"},{"input": "hello", "output": "False"},{"input": "A man a plan a canal Panama", "output": "True"}]',
  '{"python": "s = input()\n\ndef isPalindrome(s):\n    # Your code here\n    pass\n\nprint(isPalindrome(s))", "javascript": "const s = require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim();\n\nfunction isPalindrome(s) {\n  // Your code here\n}\n\nconsole.log(isPalindrome(s));"}',
  3000,
  256
);

SET @p13 = LAST_INSERT_ID();

INSERT IGNORE INTO test_cases (problem_id, input, expected_output, is_hidden, order_index) VALUES
(@p13, 'racecar',                      'True',  FALSE, 0),
(@p13, 'hello',                        'False', FALSE, 1),
(@p13, 'A man a plan a canal Panama',  'True',  FALSE, 2),
(@p13, 'Was it a car or a cat I saw',  'True',  TRUE,  3),
(@p13, 'python',                       'False', TRUE,  4);