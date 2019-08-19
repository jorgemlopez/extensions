import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Typography,
  Paragraph,
  TextField,
  CheckboxField,
  Pill,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import GatsbyIcon from './GatsbyIcon';
import styles from './styles';

export default class AppConfig extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  state = {
    previewUrl: '',
    webhookUrl: '',
    authToken: '',
    checkedContentTypes: {}
  };

  async componentDidMount() {
    const { app } = this.props.sdk.platformAlpha;
    app.onConfigure(this.configureApp);

    const [installationParams, currentState, { items }] = await Promise.all([
      app.getParameters(),
      app.getCurrentState(),
      this.props.sdk.space.getContentTypes()
    ]);

    const { EditorInterface = {} } = currentState || {};

    const previouslyCheckedTypes = Object.keys(EditorInterface).filter(
      ct => EditorInterface[ct].sidebar
    );

    const params = installationParams || {};

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(prevState => {
      return {
        checkedContentTypes: items.reduce((acc, ct) => {
          acc[ct.sys.id] = { name: ct.name, checked: previouslyCheckedTypes.includes(ct.sys.id) };
          return acc;
        }, prevState.checkedContentTypes),
        previewUrl: params.previewUrl || '',
        webhookUrl: params.webhookUrl || '',
        authToken: params.authToken || ''
      };
    });
  }

  configureApp = async () => {
    const { app } = this.props.sdk.platformAlpha;
    const { previewUrl, webhookUrl, authToken, checkedContentTypes } = this.state;

    if (!previewUrl) {
      this.props.sdk.notifier.error('You must provide a preview URL!');
      return false;
    }

    if (!previewUrl.startsWith('http')) {
      this.props.sdk.notifier.error('Please provide a valid preview URL!');
      return false;
    }

    // the webhookUrl is optional but if it is passed, check that it is valid
    if (webhookUrl && !webhookUrl.startsWith('http')) {
      this.props.sdk.notifier.error('Please provide a valid webhook URL!');
      return false;
    }

    const { EditorInterface = {} } = (await app.getCurrentState()) || {};
    const sidebarContentTypes = Object.keys(checkedContentTypes).reduce((acc, key) => {
      if (checkedContentTypes[key].checked) {
        acc[key] = { sidebar: { position: 3 } };
      } else {
        delete (acc[key] || {}).sidebar;
      }

      return acc;
    }, EditorInterface);

    return {
      parameters: {
        previewUrl,
        webhookUrl,
        authToken
      },
      targetState: {
        EditorInterface: sidebarContentTypes
      }
    };
  };

  updatePreviewUrl = e => {
    this.setState({ previewUrl: e.target.value });
  };

  updateWebhookUrl = e => {
    this.setState({ webhookUrl: e.target.value });
  };

  updateAuthToken = e => {
    this.setState({ authToken: e.target.value });
  };

  onContentTypeSelect = key => {
    this.setState(prevState => ({
      checkedContentTypes: {
        ...prevState.checkedContentTypes,
        [key]: {
          ...prevState.checkedContentTypes[key],
          checked: !prevState.checkedContentTypes[key].checked
        }
      }
    }));
  };

  render() {
    const checkedTypes = Object.keys(this.state.checkedContentTypes);

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <div className={styles.section}>
            <Typography>
              <Heading>Gatsby Cloud</Heading>
              <Paragraph>
                Gatsby is an open-source, modern website framework based on React to create and
                deploy websites or web apps with ease. This UI Extension connects to Gatsby Cloud
                which lets you see updates to your Gatsby site as soon as you change content in
                Contentful. This makes it easy for content creators to see changes they make to the
                website before going live.
              </Paragraph>
            </Typography>
          </div>
          <hr className={styles.splitter} />
          <div className={styles.section}>
            <Typography>
              <Heading>Account Details</Heading>
              <Paragraph>Gatsby Cloud needs a project ID in order to preview projects.</Paragraph>
              <TextField
                name="previewUrl"
                id="previewUrl"
                labelText="Site URL"
                value={this.state.previewUrl}
                onChange={this.updatePreviewUrl}
                className={styles.input}
                textInputProps={{
                  type: 'text'
                }}
              />
              <TextField
                name="webhookUrl"
                id="webhookUrl"
                labelText="Webhook URL"
                value={this.state.webhookUrl}
                onChange={this.updateWebhookUrl}
                className={styles.input}
                textInputProps={{
                  type: 'text'
                }}
              />
              <TextField
                name="authToken"
                id="authToken"
                labelText="Authentication Token (Optional)"
                value={this.state.authToken}
                onChange={this.updateAuthToken}
                className={styles.input}
                textInputProps={{
                  type: 'password'
                }}
              />
            </Typography>
          </div>
          <hr className={styles.splitter} />
          <div className={styles.section}>
            <Typography>
              <Heading>Preview locations</Heading>
              <Paragraph>
                Here you can choose which content type(s) will show the Gatsby Cloud preview
                functionality in the sidebar.
              </Paragraph>
              <div className={styles.checks}>
                {checkedTypes.length ? (
                  checkedTypes.map(key => (
                    <Pill
                      key={key}
                      label={
                        <CheckboxField
                          labelText={this.state.checkedContentTypes[key].name}
                          name={this.state.checkedContentTypes[key].name}
                          checked={this.state.checkedContentTypes[key].checked}
                          value={key}
                          onChange={() => this.onContentTypeSelect(key)}
                          id={key}
                        />
                      }
                      className={styles.pills}
                    />
                  ))
                ) : (
                  <SkeletonContainer width="100%">
                    <SkeletonBodyText numberOfLines={3} />
                  </SkeletonContainer>
                )}
              </div>
            </Typography>
          </div>
        </div>
        <div className={styles.icon}>
          <GatsbyIcon />
        </div>
      </>
    );
  }
}