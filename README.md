# Introduction
This is the guideline for replicating the Wizard-of-Oz experiments in paper **An Exploratory Study on How AI Awareness Impacts Human-AI Design Collaboration**. Read our paper [here](https://doi.org/10.1145/3708359.3712162) (not online yet)! We introduce how to set up the environment and the workflow for the wizards below.

# Setting up the Environment
## Preparing Materials
For participants
- Keyboard*1
- Mouse*1
- Stylus pen*1
- Touchscreen (display and operate the prototype): Dell P2418HT
- Camera: Hikvision 2K Computer Camera
- Computer (run frontend)

For Wizards
- Any real-time messaging software for sending (Wizard A) and receiving (Wizard B) messages
- Any online meeting software supporting share-screen function and recording

## Running Prototype
Frontend and backend should be hosted on the same server should you replicate the experiment. Participants will access the system through a link, and Wizard B should monitor and operate at the backend.

Run frontend

  ~~~~
  yarn start
  ~~~~

Run backend

  ~~~~
  python3 route.py
  ~~~~

# Wizards
## Setup
This experiment requires 2 wizards
1. Wizard A: Fulfill the AI awareness function
2. Wizard B: Complement the communication function

We recommand the two wizards practice several trials (at least 3) together to get familiar with the workflow and coordinate with each other.

## Operations

### Wizard A (for awareness)
|**Primamry class**   |**Subclass**|**Example actions**                                     |
|:--------------------|:-----------|:-------------------------------------------------------|
|Problem Understanding|Understand  |Understanding design assignment and task                |
|                     |Gather      |Collecting data about user or external information      |
|                     |Clarify     |Defining design constraints and objectives              |
|Idea Generation      |Generate    |Generating helpful idea for partial solution            |
|                     |Judge       |Evaluating ideas and data                               |
|Design Elaboration   |Elaborate   |Finding technical solution, realizing function and shape|
|                     |Evaluate    |Assessing the solution                                  |
|                     |Refine      |Improving the solution                                  |
|Other                |Stagnate    |Idling or hesitating for a while without progress       |

Responsibility in the Aware condition: Monitor the participants through shared screen using the online meeting software, judge their design activities using the above coding scheme (originated from [Kim et al.](https://doi.org/10.1115/DETC2006-99654)), compose and send prompts to Wizard B.

Step Control
~~~~
// Step 1->Step 2

We are designing \[ \] concepts. // input current task
Our target user is: \[ \] // input the target user participants chose
The requirements we should focus on are: // input the requirements perticipant chose
- Requirement 1
- Requirement 2
- ...
~~~~

~~~~
// Step 2-> Step 3

We have broken down the requirements considering the target user. Next, we should focus on the following key requirements:
- Key requirement 1
- Key requirement 2
- ...
~~~~

Proactive Response
~~~~
// With canvas capture

We are currently in Step [ ], designer’s design activity is [ ], and the content the designer is currently working on is presented in the image. // attach the image when sending this prompt to Wizard B
Your feedback is:
~~~~

~~~~
// Without canvas capture

We are currently in Step [ ], designer’s design activity is [ ].
Your feedback is:
~~~~

Responsibility in the Non-aware condition: compose and send prompts to Wizard B.
~~~~
We are currently in Step [ ], please think divergently/convergently according to Requirement [ ].
~~~~

### Wizard B (for communication)
Wizard A will operate the backend following the workflow below:
![Wizard A workflow](/assets/wizardA-workflow.jpg)

# Workflow
We mainly describe the workflow for setting up the environment and operating the system here, for other experimental steps, please refer to our paper (section 4).

## Before experiment
Set up your environment. Participant's and Wizards' positions are illustrated below:

Initialize GPT with predefined prompts (see Appendix B in our paper)
## During experiment
### Wizard A
1. Compose and send Step Control prompts to Wizard A when tranferring from step1->step 2 or step 2-> step 3
2. compose and send Proactive Response prompts to Wizard A per 60-90 seconds.

### Wizard B
1. Judge whether the received message should be sent to GPT
2. Respond to various situations using the predefined command described above

# Special Notes
1. The experiments were originally conducted in **Chinese**. Involved prompts in this repository are translated versions.
2. The experiments originally used the **GPT-4 turbo model**, which can be deprecated in future update.
