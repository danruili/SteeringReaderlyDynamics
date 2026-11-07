# Steering Readerly Dynamics: Trajectory-Guided Story Generation with Large Language Models

**How can we give LLM-written stories less of that "AI feel"?**

We tackle one part of the problem: readerly dynamics - the rise and fall of tension in a story, or the alternation between setups and punchlines in stand-up comedy.

We train a small LLM on human-written stories to predict how readerly dynamics should change as a story unfolds, then use its predictions to guide a larger LLM's next story segment.

Across suspense and humor, this approach **reduces reader-response trajectory error by 12%-35% while largely preserving story coherence**.

Beyond suspense and humor, the framework supports diverse reader responses represented as numerical values or text descriptions. Its plug-and-play design accommodates different writer LLMs and interactive experiences, from human-AI co-writing to text adventure games.

[Read the paper →](https://arxiv.org/abs/2611.00469)


```bibtex
@misc{li2026steeringreaderlydynamics,
  title={Steering Readerly Dynamics: Trajectory-Guided Story Generation with Large Language Models},
  author={Danrui Li and Yiwei Zhao and Mubbasir Kapadia and Lingxiao Li},
  year={2026},
  eprint={2611.00469},
  archivePrefix={arXiv},
  primaryClass={cs.CL},
  url={https://arxiv.org/abs/2611.00469}
}
```
