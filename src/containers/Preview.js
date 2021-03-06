import throttle from 'lodash-es/throttle';
import {connect} from 'react-redux';
import {v4 as uuid} from 'uuid';

import {
  addRuntimeError,
  consoleErrorProduced,
  consoleLogBatchProduced,
  consoleValueProduced,
  popOutProject,
  refreshPreview,
  saveProject,
  toggleComponent,
} from '../actions';
import Preview from '../components/Preview';
import {
  getCompiledProjects,
  getConsoleHistory,
  getCurrentProjectKey,
  getCurrentProjectPreviewTitle,
  getHiddenUIComponents,
  isCurrentProjectSyntacticallyValid,
  isUserTyping,
} from '../selectors';

function mapStateToProps(state) {
  return {
    compiledProjects: getCompiledProjects(state),
    consoleEntries: getConsoleHistory(state),
    currentProjectKey: getCurrentProjectKey(state),
    isOpen: !getHiddenUIComponents(state).includes('preview'),
    showingErrors:
      !isUserTyping(state) && !isCurrentProjectSyntacticallyValid(state),
    title: getCurrentProjectPreviewTitle(state),
  };
}

function generateConsoleLogDispatcher(dispatch, timeout) {
  let queue = [];

  function flushQueue() {
    dispatch(consoleLogBatchProduced(queue));
    queue = [];
  }

  const throttledFlushQueue = throttle(flushQueue, timeout, {
    leading: true,
    trailing: true,
  });

  return function addLogEntry(value, compiledProjectKey) {
    queue.push({value, compiledProjectKey, key: uuid().toString()});
    throttledFlushQueue();
  };
}

function mapDispatchToProps(dispatch) {
  const dispatchConsoleLog = generateConsoleLogDispatcher(dispatch, 1000);
  return {
    onConsoleError(key, compiledProjectKey, error) {
      dispatch(consoleErrorProduced(key, compiledProjectKey, error));
    },

    onConsoleValue(key, value, compiledProjectKey) {
      dispatch(consoleValueProduced(key, value, compiledProjectKey));
    },

    onConsoleLog(value, compiledProjectKey) {
      dispatchConsoleLog(value, compiledProjectKey);
    },

    onPopOutProject() {
      dispatch(popOutProject());
    },

    onRefreshClick() {
      dispatch(refreshPreview(Date.now()));
    },

    onRuntimeError(error) {
      dispatch(addRuntimeError('javascript', error));
    },

    onToggleVisible(projectKey) {
      dispatch(toggleComponent(projectKey, 'preview'));
    },

    onSave() {
      dispatch(saveProject());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Preview);
