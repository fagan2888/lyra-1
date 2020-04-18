const getInVis = require('../util/immutable-utils').getInVis;

import {Dispatch} from 'redux';
import {createStandardAction} from 'typesafe-actions';
import {Datum} from 'vega-typings/types';
import {State} from '../store'
import {Dataset, DatasetRecord, Schema} from '../store/factory/Dataset';
import {LyraAggregateTransform, PipelineRecord} from '../store/factory/Pipeline';
import * as dsUtil from '../util/dataset-utils';
import {addDataset} from './datasetActions';
import {selectPipeline} from './inspectorActions';
import {assignId} from '../util/counter';
import {ThunkDispatch} from 'redux-thunk';

/**
 * Action creator to add a new Pipeline in the store. A new pipeline requires
 * a new source dataset. Thus, we need to dispatch multiple actions.
 *
 * @param {Object} pipeline - The properties of the pipeline.
 * @param {Object} ds - The properties of the dataset.
 * @param {Array} values - A JSON array of parsed values.
 * @returns {Function} An async action function
 */
export function addPipeline (pipeline: PipelineRecord, ds: DatasetRecord, values: Datum[]) {
  return function(dispatch: ThunkDispatch<State, any, any>, getState) {
    const pid = pipeline._id || assignId(dispatch, getState());
    const dsId = assignId(dispatch, getState());
    const newDs = ds.merge({
      _id: dsId,
      name: `${pipeline.name}_${pid}_source`,
      _parent: pid
    });

    dispatch(addDataset(newDs, values));
    dispatch(baseAddPipeline(pipeline.merge({_id: pid, _source: dsId}), pid));
    dispatch(selectPipeline(pid));
  };
}

/**
 * Action creator to aggregate a pipeline based on the given transform
 * definition. The action creator dispatches actions to create a new aggregated
 * dataset, and an action to associate this new dataset with the pipeline.
 *
 * @param   {number} id        The ID of the pipeline to aggregate
 * @param   {Object} aggregate A Vega aggregate transform definition.
 * @returns {Function}         An async action function.
 */
export function aggregatePipeline (id: number, aggregate: LyraAggregateTransform) {
  return function(dispatch, getState) {
    const state: State = getState();
    const pipeline: PipelineRecord = getInVis(state, 'pipelines.' + id);
    const srcId = pipeline._source;
    const srcSchema: Schema = getInVis(state, 'datasets.' + srcId + '._schema');
    const schema = dsUtil.aggregateSchema(srcSchema, aggregate);
    const key = (aggregate.groupby as string[]).join('|'); // TODO: vega 2 aggregate.groupby is string[]

    const dsId = assignId(dispatch, getState());
    const ds = Dataset({
      _id: dsId,
      name: pipeline.get('name') + '_groupby_' + key,
      source: String(srcId),
      transform: [aggregate],
      _schema: schema,
      _parent: id
    });

    dispatch(addDataset(ds, null));
    dispatch(baseAggregatePipeline({
      dsId: aggregate._id = dsId,
      key: key
    }, id));
  };
}

// action creators prefixed with "base" should only be called by their redux-thunk function wrappers - jzong
export const baseAddPipeline = createStandardAction('ADD_PIPELINE')<PipelineRecord, number>();
export const baseAggregatePipeline = createStandardAction('AGGREGATE_PIPELINE')<{dsId: number, key: any}, number>();
export const updatePipelineProperty = createStandardAction('UPDATE_PIPELINE_PROPERTY')<{property: string, value: any}, number>();
