const getInVis = require('../../util/immutable-utils').getInVis;

import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {resetMarkVisual, setMarkVisual} from '../../actions/markActions';
import {State} from '../../store';

interface OwnProps {
  primId: number;
  primitive?: object;
  name?: string;
  className: string;

}
interface StateProps {
  field?: string;
  band?: boolean;
  group?: boolean;
  scale?: any // TODO: propTypes.instanceOf(Immutable.Map);
}

interface DispatchProps {
  setPreset: (name: string, def: any) => void;
  reset: (name: string) => void;
}

function mapStateToProps(state: State, ownProps: OwnProps): StateProps {
  const id = ownProps.primId;
  const propName = ownProps.name;
  const prop = getInVis(state, 'marks.' + id + '.encode.update.' + propName);

  return {
    field: prop.field,
    band:  prop.band,
    group: prop.group,
    scale: getInVis(state, 'scales.' + prop.scale)
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OwnProps): DispatchProps {
  const id = ownProps.primId;
  return {
    setPreset: function(name, def) {
      dispatch(setMarkVisual({property: name, def}, id));
    },
    reset: function(name) {
      dispatch(resetMarkVisual(name, id));
    }
  };
}

class BaseSpatialPreset extends React.Component<OwnProps & StateProps & DispatchProps>{
  public handleChange(evt) {
    const props = this.props;
    const name  = props.name;
    const scale = props.scale;
    const preset = name.indexOf('x') >= 0 ? 'width' : 'height';

    if (evt.target.checked) {
      props.setPreset(name, (name === 'width' || name === 'height') ? {
        scale: scale.get('_id'),
        band: true
      } : {
        group: preset
      });
    } else {
      props.reset(name);
    }
  };

  public render() {
    const props = this.props;
    const name  = props.name;
    const scale = props.scale;
    const preset = name.indexOf('x') >= 0 ? 'width' : 'height';

    if (props.field) {
      return null;
    }

    if (name === 'width' || name === 'height') {
      return (scale && scale.get('type') === 'ordinal' && !scale.get('points')) ? (
        <label>
          <input type='checkbox' name={name} checked={props.band}
            onChange={(e) => this.handleChange(e)} /> Automatic
        </label>
      ) : null;
    }

    return (
      <label>
        <input type='checkbox' name={name} checked={props.group}
          onChange={(e) => this.handleChange(e)} /> Set to group {preset}
      </label>
    );
  }
};

export const SpatialPreset = connect(mapStateToProps, mapDispatchToProps)(BaseSpatialPreset);
