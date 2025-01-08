# Introduction
This is the guideline for replicating the Wizard-of-Oz experiments in paper **An Exploratory Study on How AI Awareness Impacts Human-AI Design Collaboration**. We introduce how to set up the environment and the workflow for the wizards below.

# Environment
## Materials
For participants
- Keyboard*1
- Mouse*1
- Stylus pen*1
- Touch screen (display and operate the prototype): Dell P2418HT
- Camera: Hikvision 2K Computer Camera
- Computer (run frontend)

For Wizards
- Any real-time messaging software for sending (Wizard A) and receiving (Wizard B) messages
- Any online meeting software supporting share-screen function and recording

## Run Prototype
todo: 前后端分离

Frontend

  ~~~~
  cd frontend
  yarn start
  ~~~~

Backend

  ~~~~
  cd backend
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

### Wizard B (for communication)

# Workflow

## Before experiment

## During experiment

# Special Notes
1. The experiments were originally conducted in **Chinese**. Involved prompts were translated to English in this repository.
2. The experiments originally used the **GPT-4 turbo model**, which can be deprecated in future update.
