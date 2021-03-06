import React from "react";
import ReactDOM from "react-dom";

import AbstractNode from "../AbstractNode";
import { ParentNodeCtx } from "../utils";
import * as type from '../eventType';
import * as nodeAttr from '../nodeAttr';

const EL_PREV_VALUE = Symbol("el_prev_value");
const ATTR_INITIAL_VALUE = Symbol("attr_initial_value");

export const TYPE = Symbol('ui_element');

class UIElement extends AbstractNode {
    constructor(props) {
        super(props);
        const { name, defaultValue, defaultState = {}, initialValues } = props;
        this[nodeAttr.TYPE] = TYPE;

        if (!this.isValueless()) {
            const initialValue = typeof initialValues[name] !== "undefined" ? initialValues[name] : defaultValue;
            this.state.value = initialValue;
            this[ATTR_INITIAL_VALUE] = initialValue;
        } else {
            this.state.value = defaultValue;
            this[EL_PREV_VALUE] = null;
        }
        this.state.state = defaultState;
        this.state.errors = {};
    }

    state = {};

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        //console.log("UIElement should update");
        return true;
    }

    componentDidMount() {
        this.dispatch(this.createRegisterEvent(), false);
    }

    createRegisterEvent = () => {
        const domNode = ReactDOM.findDOMNode(this);
        return this.createEvent(type.REGISTER, {
            domNode,
            value: this.state.value
        });
    };

    getInitialValue = () => {
        return this[ATTR_INITIAL_VALUE];
    };

    getValue = () => {
        return this.state.value;
    };

    setValue = (value, onUpdated) => {
        this[EL_PREV_VALUE] = this.state.value;
        this.setState({ value }, onUpdated);
    };

    getPrevValue = () => {
        return this[EL_PREV_VALUE];
    };

    getState = () => {
        return this.state.state;
    };

    _setState = (newStatePart, onUpdated) => {
        const newState = { ...this.state.state, ...newStatePart };
        this.setState({ state: newState }, onUpdated);
    };

    clearState = () => {
        this.setState({ state: {} });
    };

    resetState = () => {
        const { defaultState = {} } = this.props;
        this.setState({ state: defaultState });
    };

    getErrors = () => {
        return this.state.errors;
    };

    setError = error => {
        this.setState({ errors: { ...this.getErrors(), ...error } });
    };

    clearErrors = () => {
        this.setState({ errors: {} });
    };

    reset = () => {
        const { defaultValue } = this.props;
        this.setValue(defaultValue);
        this.resetState();
        this.clearErrors();
    };

    isValueless = () => {
        const { name, defaultValue } = this.props;
        return (
            defaultValue === undefined || typeof name !== "string" || !name.length
        );
    };

    onReset = e => {
        console.log("reset");
    };

    render() {
        const { children } = this.props;
        const { value, state, errors } = this.state;
        const elementProps = {
            value,
            state,
            errors,
            dispatch: (type, payload, async = true) => {
                const event = this.createEvent(type, payload);
                return this.dispatch(event, async);
            }
        };

        const renderProps = { ChildComponent: children(elementProps) };

        return super.render(renderProps);
    }
}

export default function(props) {
    const { getComponentRef, ...rest } = props;
    return (
        <ParentNodeCtx.Consumer>
            {({ initialValues, renderElementWrapper }) => {
                const ElementComponent = (
                    <UIElement
                        ref={ref => getComponentRef && getComponentRef(ref)}
                        {...rest}
                        initialValues={initialValues}
                    />
                );
                if (renderElementWrapper)
                    return renderElementWrapper({
                        children: ElementComponent,
                        name: props.name
                    });
                else return ElementComponent;
            }}
        </ParentNodeCtx.Consumer>
    );
}
