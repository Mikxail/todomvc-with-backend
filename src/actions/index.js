import lodash from 'lodash';
import fetch from 'isomorphic-fetch';
import * as types from '../constants/ActionTypes'
import {
    HOST,
    LIST_ID
} from '../constants/Config';

export const addTodo = text => ({ type: types.ADD_TODO, text });
export const deleteTodo = id => ({ type: types.DELETE_TODO, id });
export const editTodo = (id, text) => ({ type: types.EDIT_TODO, id, item: {id, text} });
export const completeTodo = id => ({ type: types.COMPLETE_TODO, id });
export const uncompleteTodo = id => ({ type: types.UNCOMPLETE_TODO, id });
export const completeAll = () => ({ type: types.COMPLETE_ALL });
export const clearCompleted = () => ({ type: types.CLEAR_COMPLETED });

export const updateTodo = (id, params) => dispatch => {
    return dispatch({
        type: types.EDIT_TODO,
        id: id,
        item: params
    });
};

const _getAllTodos = (ctx) => {
    return fetch(HOST + '/items/' + LIST_ID, {
        headers: {
            'content-type': 'application/json'
        },
    }).then(res => res.json());
};

export const getAllTodos = () => (dispatch, getState) => {
    return _getAllTodos(getState().context).then(res => {
        return dispatch({
            type: types.ALL_TODOS,
            res: res
        });
    });
};

const _pushAllTodos = (ctx, items) => {
    return fetch(HOST+'/items/' + LIST_ID , {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            "ctx": ctx,
            "items": items
        })
    }).then(res => res.ok);
};

export const pushAllTodos = () => (dispatch, getState) => {
    var state = getState();
    var todos = state.todos;
    var remoteTodos = state.remoteTodos;
    todos = todos.map(todo => {
        var rTodo = lodash.find(remoteTodos, {id: todo.id}) || {tags: [], text: {}};
        rTodo.tagsToAdd = [];
        rTodo.tagsToRemove = [];
        if (lodash.isEqual(todo, rTodo)) return null;

        todo.tagsToAdd = (todo.tags || []).filter(t => {
            return rTodo.tags.indexOf(t) == -1;
        });
        todo.tagsToRemove = (rTodo.tags || []).filter(t => {
            return todo.tags.indexOf(t) == -1;
        });
        var isChanged = false;
        ['text', 'done', 'likes', 'tagsToAdd', 'tagsToRemove'].forEach(f => {
            if (lodash.isEqual(rTodo[f], todo[f])) {
                delete todo[f];
            } else {
                isChanged = true;
            }
        });
        if (!isChanged) return null;
        if (todo.text){
            todo.text.text = todo.text.text[0];
        }
        delete todo.tags;
        return todo;
    }).filter(Boolean);
    if (!todos.length) {
        return getAllTodos()(dispatch, getState);
    }
    return _pushAllTodos(state.context, todos).then(res => {
        return getAllTodos()(dispatch, getState);
        // return dispatch({
        //     type: types.ALL_TODOS,
        //     res: res
        // });
    });
};