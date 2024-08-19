from typing import List, Sequence

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import END, MessageGraph, StateGraph

import graph_agent
 
# thread = {"configurable": {"thread_id": "3"}}

ROUTER = 'router'
SIGN_EXPERT = 'signExpert'
GENERIC_EXPERT = 'genericExpert'

graph = None

# state is sequence of messages
def router_node(state: Sequence[BaseMessage]):
    print("op=router_node")
    last_message_img = state[-1]
    last_message_human = state[-2]
    human_question = last_message_human.content[-1]['text']

    res = graph_agent.router_chain.invoke({"user_input": human_question})
    print(res.content, "result=response from router_node")

    return [HumanMessage(content=[last_message_human.content[-1],
        last_message_img.content[-1]
    ]), AIMessage(content=res.content)]


def sign_expert_node(state: Sequence[BaseMessage]) -> List[BaseMessage]:
    last_message_human = state[-2]
    res = graph_agent.sign_chain_invoke(last_message_human.content)

    print(res, "response from sign_expert_node")
    return [AIMessage(content=res.content)]

def general_expert_node(state: Sequence[BaseMessage]) -> List[BaseMessage]:
    last_message_human = state[-2]
    
    res = graph_agent.generic_chain_invoke(last_message_human.content) 
    print(res, "response from general_expert_node")
    
    return [AIMessage(content=res.content)]

def should_continue(state: List[BaseMessage]):
    if (state[-1] and state[-1].content == 'generic'):
        return GENERIC_EXPERT
    elif (state[-1] and state[-1].content == 'sign'):
       return SIGN_EXPERT
    
    return END


def create_graph() -> StateGraph: 
    builder = MessageGraph() 
    builder.add_node(ROUTER, router_node)
    builder.add_node(SIGN_EXPERT, sign_expert_node)
    builder.add_node(GENERIC_EXPERT, general_expert_node)
    builder.set_entry_point(ROUTER)
    builder.add_conditional_edges(ROUTER, should_continue)
    builder.add_edge(SIGN_EXPERT, END)
    builder.add_edge(GENERIC_EXPERT, END)

    graph = builder.compile()

    # to visualize
    # print(graph.get_graph().draw_mermaid())

    return graph

