import { flatMap, values } from 'lodash';
import React from 'react';
import { react2angular } from 'react2angular';

import Alert from 'antd/lib/alert';
import Tabs from 'antd/lib/tabs';
import * as Grid from 'antd/lib/grid';
import Layout from '@/components/admin/Layout';
import { CounterCard } from '@/components/admin/CeleryStatus';
import { QueuesTable, OtherJobsTable } from '@/components/admin/RQStatus';

import { $http } from '@/services/ng';
import recordEvent from '@/services/recordEvent';
import { routesToAngularRoutes } from '@/lib/utils';

class Jobs extends React.Component {
  state = {
    isLoading: true,
    error: null,

    queueCounters: [],
    overallCounters: { started: 0, queued: 0 },
    startedJobs: [],
  };

  componentDidMount() {
    recordEvent('view', 'page', 'admin/jobs');
    $http
      .get('/api/admin/queries/jobs')
      .then(({ data }) => this.processQueues(data))
      .catch(error => this.handleError(error));
  }

  componentWillUnmount() {
    // Ignore data after component unmounted
    this.processQueues = () => {};
    this.handleError = () => {};
  }

  processQueues = (queues) => {
    const queueCounters = values(queues).map(({ name, started, queued }) => ({
      name,
      started: started.length,
      queued: queued.length,
    }));

    const overallCounters = queueCounters.reduce(
      (c, q) => ({
        started: c.started + q.started,
        queued: c.queued + q.queued,
      }),
      { started: 0, queued: 0 },
    );

    const startedJobs = flatMap(values(queues), queue => queue.started);

    this.setState({ isLoading: false, queueCounters, startedJobs, overallCounters });
  };

  handleError = (error) => {
    this.setState({ isLoading: false, error });
  };

  render() {
    const { isLoading, error, queueCounters, startedJobs, overallCounters } = this.state;

    return (
      <Layout activeTab="jobs">
        <div className="p-15">
          {error && (
            <Alert type="error" message="Failed loading status. Please refresh." />
          )}

          {!error && (
            <React.Fragment>
              <Grid.Row gutter={15} className="m-b-15">
                <Grid.Col span={8}>
                  <CounterCard title="Started Jobs" value={overallCounters.started} loading={isLoading} />
                </Grid.Col>
                <Grid.Col span={8}>
                  <CounterCard title="Queued Jobs" value={overallCounters.queued} loading={isLoading} />
                </Grid.Col>
              </Grid.Row>

              <Tabs defaultActiveKey="queues" animated={false}>
                <Tabs.TabPane key="queues" tab="Queues">
                  <QueuesTable loading={isLoading} items={queueCounters} />
                </Tabs.TabPane>
                <Tabs.TabPane key="other" tab="Other Jobs">
                  <OtherJobsTable loading={isLoading} items={startedJobs} />
                </Tabs.TabPane>
              </Tabs>
            </React.Fragment>
          )}
        </div>
      </Layout>
    );
  }
}

export default function init(ngModule) {
  ngModule.component('pageJobs', react2angular(Jobs));

  return routesToAngularRoutes([
    {
      path: '/admin/queries/jobs',
      title: 'RQ Status',
      key: 'jobs',
    },
  ], {
    template: '<page-jobs></page-jobs>',
  });
}

init.init = true;
