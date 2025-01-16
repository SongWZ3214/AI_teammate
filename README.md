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

Responsibility in the Non-aware condition: 


### Wizard B (for communication)

# Workflow

## Before experiment

## During experiment

# Special Notes
1. The experiments were originally conducted in **Chinese**. Involved prompts in this repository are translated versions.
2. The experiments originally used the **GPT-4 turbo model**, which can be deprecated in future update.
